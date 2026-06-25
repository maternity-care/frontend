"use client";

import { useState } from "react";
import { DatePicker, Form, Input, Modal, Select, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";

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
      title="Tạo lịch nhắc mới"
      open={open}
      onCancel={handleCancel}
      okText="Tạo lịch"
      cancelText="Hủy"
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
          label="Tiêu đề"
          name="title"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Vui lòng nhập tiêu đề lịch nhắc",
            },
          ]}
        >
          <Input placeholder="Ví dụ: Uống viên sắt, tái khám, đo huyết áp..." />
        </Form.Item>

        <Form.Item
          label="Loại lịch"
          name="type"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn loại lịch",
            },
          ]}
        >
          <Select options={scheduleTypeOptions} />
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            label="Ngày"
            name="date"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ngày",
              },
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Giờ"
            name="time"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn giờ",
              },
            ]}
          >
            <TimePicker className="w-full" format="HH:mm" />
          </Form.Item>
        </div>

        <Form.Item label="Địa điểm" name="location">
          <Input placeholder="Ví dụ: Phòng khám, bệnh viện, tại nhà..." />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea
            rows={3}
            placeholder="Nhập ghi chú cho lịch nhắc nếu có"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}