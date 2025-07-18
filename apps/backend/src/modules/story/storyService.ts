import { StoryRepository } from "./storyRepository";
import { CreateStoryDTO, StoryWithUnknownWords } from "./story.types";
import { Story, UserVocabulary } from "@prisma/client";
import { CreateUnknownWordDTO } from "../unknownWord/unknownWord.types";
import { NotFoundError } from "@/errors/NotFoundError";
import { StoryAssembler } from "./services/storyAssembler/storyAssembler";
import { LemmaAssembler } from "./services/lemmaAssembler/lemmaAssembler";
import { AudioAssembler } from "./services/audioAssembler/audioAssembler";
import { LanguageCode } from "@/utils/languages";
import { RedisStoryCache } from "@/cache/redisStoryCache";
import { logger } from "@/utils/logger";

export class StoriesService {
  constructor(
    private storyRepository: StoryRepository,
    private storyAssembler: StoryAssembler,
    private lemmaAssembler: LemmaAssembler,
    private audioAssembler: AudioAssembler,
    private redisStoryCache: RedisStoryCache
  ) {}

  public async generateFullStoryExperience(
    userId: number,
    languageCode: LanguageCode,
    originalLanguageCode: LanguageCode,
    subject: string = ""
  ): Promise<{
    story: CreateStoryDTO;
    unknownWords: CreateUnknownWordDTO[];
    knownWords: UserVocabulary[];
  }> {
    const { story, fullTranslation, translationChunks, knownWords } =
      await this.storyAssembler.assemble(subject, userId, languageCode, originalLanguageCode);
    const unknownWords = await this.lemmaAssembler.assemble(
      story,
      knownWords,
      userId,
      languageCode,
      originalLanguageCode
    );
    const audioUrl = await this.audioAssembler.assemble(
      translationChunks,
      unknownWords,
      languageCode,
      originalLanguageCode
    );

    return {
      story: {
        storyText: story,
        translationText: fullTranslation,
        audioUrl,
        userId,
      },
      unknownWords,
      knownWords,
    };
  }

  async saveStoryToDB(story: CreateStoryDTO): Promise<Story> {
    const res = await this.storyRepository.saveStoryToDB(story);
    try {
      await this.redisStoryCache.invalidateStoryCache(story.userId);
    } catch (error) {
      logger.error("Failed invalidating story cache", error);
    }
    return res;
  }

  async getAllStories(userId: number): Promise<Story[]> {
    const cachedStories = await this.redisStoryCache.getAllStoriesFromCache(userId);
    if (cachedStories.length > 0) {
      return cachedStories;
    }

    const stories = await this.storyRepository.getAllStories(userId);
    try {
      await this.redisStoryCache.saveStoriesToCache(userId, stories);
    } catch (error) {
      logger.warn("Redis cache error", { error, userId });
    }
    return stories;
  }

  async connectUnknownWords(
    storyId: number,
    wordIds: { id: number }[]
  ): Promise<StoryWithUnknownWords> {
    return await this.storyRepository.connectUnknownWords(storyId, wordIds);
  }
}
