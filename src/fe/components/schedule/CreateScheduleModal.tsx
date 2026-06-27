"use client";

import { useState } from "react";
import { DatePicker, Form, Input, Modal, Select, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type CreateScheduleFormValues = {
  title: string;
  type: PregnancyScheduleType;
  date: Dayjs;
  time: Dayjs;
  location?: string;
  note?: string;
};

type CreateScheduleModalProps = {
  open: boolean;
  onCancel: () => void;
  onCreate: (schedule: PregnancyScheduleItem) => void;
};

const CREATE_SCHEDULE_FORM_ID = "create-schedule-form";

const scheduleTypeOptions: Array<{
  label: string;
  value: PregnancyScheduleType;
}> = [
  {
    label: "Khám thai",
    value: "checkup",
  },
  {
    label: "Siêu âm",
    value: "ultrasound",
  },
  {
    label: "Xét nghiệm",
    value: "lab",
  },
  {
    label: "Nhắc uống thuốc",
    value: "medicine",
  },
  {
    label: "Tư vấn",
    value: "consultation",
  },
  {
    label: "Nhắc nhở cá nhân",
    value: "reminder",
  },
];

function getInitialScheduleFormValues(): CreateScheduleFormValues {
  return {
    title: "",
    type: "reminder",
    date: dayjs(),
    time: dayjs().add(1, "hour"),
    location: "",
    note: "",
  };
}

export function CreateScheduleModal({
  open,
  onCancel,
  onCreate,
}: CreateScheduleModalProps) {
  const [formKey, setFormKey] = useState(0);

  const resetFormByRemount = () => {
    setFormKey((current) => current + 1);
  };

  const handleFinish = (values: CreateScheduleFormValues) => {
    const newSchedule: PregnancyScheduleItem = {
      id: crypto.randomUUID(),
      title: values.title.trim(),
      type: values.type,
      date: values.date.format("YYYY-MM-DD"),
      time: values.time.format("HH:mm"),
      status: "upcoming",
      createdByUser: true,
    };

    const location = values.location?.trim();
    const note = values.note?.trim();

    if (location) {
      newSchedule.location = location;
    }

    if (note) {
      newSchedule.note = note;
    }

    onCreate(newSchedule);
    resetFormByRemount();
  };

  const handleCancel = () => {
    resetFormByRemount();
    onCancel();
  };

  return (
    <Modal
      title={RESPONSE_MESSAGES.SCHEDULE.CREATE_NEW_SCHEDULE}
      open={open}
      onCancel={handleCancel}
      okText={RESPONSE_MESSAGES.SCHEDULE.CREATE_SCHEDULE}
      cancelText={RESPONSE_MESSAGES.COMMON.CANCEL}
      destroyOnHidden
      okButtonProps={{
        htmlType: "submit",
        form: CREATE_SCHEDULE_FORM_ID,
      }}
    >
      <Form<CreateScheduleFormValues>
        key={formKey}
        id={CREATE_SCHEDULE_FORM_ID}
        layout="vertical"
        requiredMark={false}
        initialValues={getInitialScheduleFormValues()}
        onFinish={handleFinish}
      >
        <Form.Item
          label={RESPONSE_MESSAGES.COMMON.TITLE}
          name="title"
          rules={[
            {
              required: true,
              whitespace: true,
              message: RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_TITLE_DESCRIPTION,
            },
          ]}
        >
          <Input placeholder={RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_TITLE_SCHEDULE_EXAMPLE} />
        </Form.Item>

        <Form.Item
          label={RESPONSE_MESSAGES.SCHEDULE.SCHEDULE_TYPE}
          name="type"
          rules={[
            {
              required: true,
              message: RESPONSE_MESSAGES.SCHEDULE.SCHEDULE_TYPE_REQUIRED,
            },
          ]}
        >
          <Select options={scheduleTypeOptions} />
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.DATE}
            name="date"
            rules={[
              {
                required: true,
                message: RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_DATE_DESCRIPTION,
              },
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label={RESPONSE_MESSAGES.COMMON.HOUR}
            name="time"
            rules={[
              {
                required: true,
                message: RESPONSE_MESSAGES.COMMON_DESCRIPTION.enterHourDescription,
              },
            ]}
          >
            <TimePicker className="w-full" format="HH:mm" />
          </Form.Item>
        </div>

        <Form.Item label={RESPONSE_MESSAGES.COMMON.LOCATION} name="location">
          <Input placeholder={RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_LOCATION_SCHEDULE_EXAMPLE} />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea
            rows={3}
            placeholder={RESPONSE_MESSAGES.COMMON_DESCRIPTION.ENTER_NOTE_DESCRIPTION}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}