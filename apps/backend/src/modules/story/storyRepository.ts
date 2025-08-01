import { Base64 } from "@/types/types";
import { CreateStoryDTO, StoryWithUnknownWords } from "./story.types";
import { Prisma, PrismaClient, Story, UnknownWord } from "@prisma/client";
import { StorageError } from "@/errors/StorageError";
import { PrismaError } from "@/errors/PrismaError";
import { SupabaseClient } from "@supabase/supabase-js";

function getRandomFileName(extension: string) {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
}

function base64ToArrayBuffer(base64: Base64) {
  const binary = Buffer.from(base64, "base64");
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

export class StoryRepository {
  constructor(private prisma: PrismaClient, private storageClient: SupabaseClient) {}

  private getClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | PrismaClient {
    return tx ? tx : this.prisma;
  }

  async getAllStories(
    userId: number,
    tx?: Prisma.TransactionClient
  ): Promise<(Story & { unknownWords: UnknownWord[] })[]> {
    const client = this.getClient(tx);
    try {
      const stories = await client.story.findMany({
        where: {
          userId,
        },
        include: {
          unknownWords: true,
        },
        orderBy: {
          id: "desc",
        },
      });

      return stories;
    } catch (error) {
      throw new PrismaError("Unable to get all stories", error, { userId });
    }
  }

  async saveStoryToDB(story: CreateStoryDTO, tx?: Prisma.TransactionClient): Promise<Story> {
    const client = this.getClient(tx);
    try {
      const savedStory = await client.story.create({
        data: story,
      });
      return savedStory;
    } catch (error) {
      throw new PrismaError("Unable to save story to DB", error, { story });
    }
  }

  // save story audio to storage (.mp3)
  async saveStoryAudioToStorage(story: Base64): Promise<string> {
    const fileName = getRandomFileName("mp3");
    // story to ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(story);
    const { data, error } = await this.storageClient.storage
      .from("stories")
      .upload(fileName, arrayBuffer, {
        contentType: "audio/mpeg",
      });

    if (error) {
      throw new StorageError("Unable to save story audio to storage", error, { fileName });
    }
    if (!data) {
      throw new StorageError("Unable to save story audio to storage", error, { fileName });
    }

    return data.path;
  }

  async connectUnknownWords(
    storyId: number,
    wordIds: { id: number }[],
    tx?: Prisma.TransactionClient
  ): Promise<StoryWithUnknownWords> {
    const client = this.getClient(tx);
    try {
      const response = await client.story.update({
        where: { id: storyId },
        data: {
          unknownWords: {
            connect: wordIds,
          },
        },
        include: {
          unknownWords: true,
        },
      });
      return response;
    } catch (error) {
      throw new PrismaError("Unable to connect unknown words", error, { storyId, wordIds });
    }
  }
}
