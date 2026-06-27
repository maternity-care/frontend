"use client";

import { useState } from "react";
import { Alert, Button, Card } from "antd";
import { Pencil, UserRound, X } from "lucide-react";
import { FeedbackState, PregnantProfile, ProfileUpdateHandler } from "@/features/profile/profile.types";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { PersonalInfoView } from "./ProfileInfoView";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";


type ProfileEditCardProps = {
  profile: PregnantProfile;
  feedback: FeedbackState;
  onClearFeedback: () => void;
  onUpdated: ProfileUpdateHandler;
  onError: (message: string) => void;
};

export function ProfileEditCard({
  profile,
  feedback,
  onClearFeedback,
  onUpdated,
  onError,
}: ProfileEditCardProps) {
  const [editing, setEditing] = useState(false);

  const startEditing = () => {
    onClearFeedback();
    setEditing(true);
  };

  const cancelEditing = () => {
    onClearFeedback();
    setEditing(false);
  };

  const handleUpdated: ProfileUpdateHandler = async (updated, message) => {
    await onUpdated(updated, message);
    setEditing(false);
  };

  return (
    <Card
      className="border-0 shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-pink-500" />
          <span>{RESPONSE_MESSAGES.PROFILE.PERSONAL_INFO}</span>
        </div>
      }
      extra={
        editing ? (
          <Button
            type="text"
            danger
            icon={<X className="h-4 w-4" />}
            onClick={cancelEditing}
          >
            {RESPONSE_MESSAGES.COMMON.CANCEL}
          </Button>
        ) : (
          <Button
            type="primary"
            ghost
            icon={<Pencil className="h-4 w-4" />}
            onClick={startEditing}
          >
            {RESPONSE_MESSAGES.COMMON.EDIT}
          </Button>
        )
      }
    >
      <div className="mb-5 grid gap-3">
        {feedback.message ? (
          <Alert type="success" showIcon message={feedback.message} />
        ) : null}

        {feedback.error ? (
          <Alert type="error" showIcon message={feedback.error} />
        ) : null}
      </div>

      {editing ? (
        <PersonalInfoForm
          profile={profile}
          onCancel={cancelEditing}
          onUpdated={handleUpdated}
          onError={onError}
          onClearFeedback={onClearFeedback}
        />
      ) : (
        <PersonalInfoView profile={profile} />
      )}
    </Card>
  );
}