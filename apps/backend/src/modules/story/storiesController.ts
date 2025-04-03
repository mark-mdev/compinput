import { Request, Response } from "express";
import { StoriesService } from "./storiesService";
import { UnknownWordService } from "../unknownWord/unknownWordService";
const storiesService = new StoriesService();
const unknownWordService = new UnknownWordService();

export class StoriesController {
  async generateStory(req: Request, res: Response) {
    const { subject } = req.body;
    const story = await storiesService.generateFullStoryExperience(subject);
    const savedStory = await storiesService.saveStoryToDB(story);
    const unknownWords = await unknownWordService.saveUnknownWords(
      story.unknownWords,
      savedStory.id
    );
    res.status(200).json({ story: savedStory, unknownWords });
  }
}

export default StoriesController;
