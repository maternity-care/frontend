"use client";

import { useEffect, useState } from "react";
import { Alert, Col, Row } from "antd";

import { useAuthStore } from "@/features/auth/auth.store";
import type {
  FeedbackState,
  User,
  UserProfile,
} from "@/features/profile/profile.types";
import useAuth, { getUserData } from "@/hooks/useAuth";

import { ProfileEditCard } from "./ProfileEditCard";
import { ProfileLoading } from "./ProfileLoading";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

export function ProfileContent() {
  const { currentUser, mutate } = useAuth();
  const setStoreUser = useAuthStore((state) => state.setUser);
  const [userData, setUserData] = useState<User | null>(null);

  const [updatedProfile, setUpdatedProfile] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: null,
    error: null,
  });

  const profile = updatedProfile ?? currentUser ?? null;

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
      message: message || "Đã cập nhật hồ sơ.",
      error: null,
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // todo: lấy thông tin người dùng
        const userData = await getUserData();
        setUserData(userData);
        console.log("userData", userData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

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
    return (
      <Alert
        type="error"
        showIcon
        title={RESPONSE_MESSAGES.PROFILE.UNABLE_TO_LOAD_PROFILE}
        description={feedback.error ?? RESPONSE_MESSAGES.AUTH.RETURN_LOGIN}
      />
    );
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
        </Col>
      </Row>
    </div>
  );
}