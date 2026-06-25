"use client";

import { useState } from "react";
import { Col, Row } from "antd";

import { useAuthStore } from "@/features/auth/auth.store";
import type { FeedbackState, PregnantProfile, UserProfile } from "@/features/profile/profile.types";
import useAuth from "@/hooks/useAuth";
import { ProfileError } from "./ProfileError";
import { ProfileEditCard } from "./ProfileEditCard";
import { PregnantInfoCard } from "./PregnantInfoCard";
import { CareTrackingCard } from "./CardTrackingCard";
import { ProfileLoading } from "./ProfileLoading";
import { ProfileSummaryCard } from "./ProfileSummaryCard";


export function ProfileContent() {
  const { currentUser, mutate } = useAuth();
  const setStoreUser = useAuthStore((state) => state.setUser);

  const [updatedProfile, setUpdatedProfile] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: null,
    error: null,
  });

  const profile = (updatedProfile ?? currentUser ?? null) as PregnantProfile | null;

  const clearFeedback = () => {
    setFeedback({
      message: null,
      error: null,
    });
  };

  const handleProfileUpdated = async (updated: UserProfile, message?: string) => {
    setUpdatedProfile(updated);
    setStoreUser(updated);

    await mutate(updated, {
      revalidate: false,
    });

    setFeedback({
      message: message || "Đã cập nhật hồ sơ thai phụ.",
      error: null,
    });
  };

  const handleProfileError = (message: string) => {
    setFeedback({
      message: null,
      error: message,
    });
  };

  if (!profile && !feedback.error) {
    return <ProfileLoading />;
  }

  if (!profile) {
    return <ProfileError error={feedback.error} />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <ProfileSummaryCard profile={profile} />
        </Col>

        <Col xs={24} lg={16}>
          <ProfileEditCard
            profile={profile}
            feedback={feedback}
            onClearFeedback={clearFeedback}
            onUpdated={handleProfileUpdated}
            onError={handleProfileError}
          />

          <Row gutter={[24, 24]} className="mt-6">
            <Col xs={24} xl={12}>
              <PregnantInfoCard profile={profile} />
            </Col>

            <Col xs={24} xl={12}>
              <CareTrackingCard profile={profile} />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}