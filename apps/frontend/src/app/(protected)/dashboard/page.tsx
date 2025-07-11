"use client";

import { StoryApi } from "@/feautures/story/api";
import StoryComponent from "@/feautures/story/components/Story";
import StoryList from "@/feautures/story/components/StoryList";
import { Story } from "@/feautures/story/types";
import { ClientApi } from "@/lib/ClientApi";
import { ApiError } from "@/types/ApiError";
import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { toast } from "react-toastify";
import StoryGeneration from "@/feautures/story/components/StoryGeneration";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import Skeleton from "react-loading-skeleton";
import RightPanel from "@/components/RightPanel";
import TopPanelMob from "@/components/TopPanelMob";
import { UnknownWordApi } from "@/feautures/unknownWord/api";
import LeftPanel from "@/feautures/dashboard/LeftPanel";
import { JobResponse } from "@/lib/backendApi.client";

const clientApi = new ClientApi();
const storyApi = new StoryApi(clientApi);
const unknownWordApi = new UnknownWordApi(clientApi);

interface JobStatusResponse {
  status: "completed" | "failed" | "waiting" | "active" | "delayed" | "paused";
  value?: unknown;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const chosenStoryId = searchParams.get("story");
  const { data, error, isLoading, mutate } = useSWR("/api/story", () => storyApi.getAllStories());
  const chosenStory = data?.find((s) => String(s.id) === chosenStoryId) ?? null;
  const viewMode: "chosenStory" | "newStory" | "allStories" =
    (searchParams.get("viewMode") as "chosenStory" | "newStory" | "allStories") || "newStory";
  const router = useRouter();

  useEffect(() => {
    if (error?.statusCode === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  const refetchStories = () => {
    mutate();
  };

  const setViewMode = useCallback(
    (mode: "chosenStory" | "newStory" | "allStories", storyId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("viewMode", mode);
      if (storyId) {
        params.set("story", storyId);
      } else {
        params.delete("story");
      }
      router.replace(`${window.location.pathname}?${params.toString()}`);
    },
    [router, searchParams]
  );

  const updateCurrentDataWithNewWordStatus = (
    currentData: Story[] | undefined,
    wordId: number,
    newStatus: "learned" | "learning"
  ) => {
    if (!currentData) return currentData;
    return currentData.map((story) => {
      if (story.id !== chosenStory?.id) {
        return story;
      }
      return {
        ...story,
        unknownWords: story.unknownWords.map((word) =>
          word.id !== wordId ? word : { ...word, status: newStatus }
        ),
      };
    });
  };

  const handleStatusChangeJob = async (
    wordId: number,
    newStatus: "learned" | "learning",
    job: JobResponse
  ) => {
    mutate(
      (currentData) => updateCurrentDataWithNewWordStatus(currentData, wordId, newStatus),
      false
    );
    let res: JobStatusResponse | undefined;
    while (!res || res.status !== "completed") {
      res = await unknownWordApi.checkJobStatus(job.queueName, job.jobId);
      console.log(res);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    mutate();
  };

  const handleWordStatusChange = async (wordId: number, newStatus: "learned" | "learning") => {
    const previousData = data;
    try {
      let job: JobResponse;

      if (newStatus === "learned") {
        job = await unknownWordApi.markAsLearned(wordId);
      } else {
        job = await unknownWordApi.markAsLearning(wordId);
      }
      console.log(job);
      await handleStatusChangeJob(wordId, newStatus, job);
    } catch (error) {
      mutate(() => previousData, false);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unknown error happened");
      }
      mutate();
    }
    toast(`Word marked as ${newStatus}`);
  };

  const handleClickOnStory = useCallback(
    (story: Story) => {
      setViewMode("chosenStory", String(story.id));
    },
    [setViewMode]
  );

  const handleChangeToNewStoryViewMode = useCallback(() => {
    setViewMode("newStory");
  }, [setViewMode]);

  const handleChangeToAllStoriesViewMode = useCallback(() => {
    setViewMode("allStories");
  }, [setViewMode]);

  if (error?.statusCode === 401) {
    return <div>Redirecting...</div>;
  }

  if (error) throw new ApiError("Unexpected server error", 502);

  return (
    <div className="flex flex-col bg-gray-100 h-screen">
      {/* TOP PANEL (MOB) */}
      <TopPanelMob
        viewMode={viewMode}
        onChangeToNewStoryViewMode={handleChangeToNewStoryViewMode}
        onChangeToAllStoriesViewMode={handleChangeToAllStoriesViewMode}
      />
      <div className="flex flex-row gap-8 flex-1 min-h-0">
        {/* LEFT PANEL */}
        <LeftPanel
          isLoading={isLoading}
          data={data}
          handleClickOnStory={handleClickOnStory}
          chosenStory={chosenStory}
          viewMode={viewMode}
          handleChangeToNewStoryViewMode={handleChangeToNewStoryViewMode}
        />
        {/* RIGHT */}
        {viewMode === "chosenStory" && (
          <RightPanel>
            <StoryComponent story={chosenStory} onWordStatusChange={handleWordStatusChange} />
          </RightPanel>
        )}
        {viewMode === "newStory" && (
          <RightPanel styles="bg-radial from-white to-gray-100 from-30% justify-center">
            <StoryGeneration
              refetchStories={refetchStories}
              setToNewStory={handleClickOnStory}
              isPageLoading={isLoading}
            />
          </RightPanel>
        )}
        {viewMode === "allStories" && (
          <div className="justify-between w-full py-8 px-6 bg-white rounded-lg flex flex-col">
            {/* TOP */}
            <div>
              <h2 className="font-semibold text-2xl">Stories</h2>
              <hr className="my-4" />
              {isLoading ? (
                <Skeleton count={6} height={50} />
              ) : (
                <StoryList
                  storyList={data}
                  setChosenStory={handleClickOnStory}
                  chosenStoryId={chosenStory?.id || null}
                ></StoryList>
              )}
            </div>
            {/* BOTTOM */}
            <Button onClick={handleChangeToNewStoryViewMode}>Generate New Story</Button>
          </div>
        )}
      </div>
    </div>
  );
}
