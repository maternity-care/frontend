"use client";

import { useMemo, useState } from "react";
import { Form, Modal } from "antd";
import type { FormInstance } from "antd";
import {
  extractGeocodeFields,
  getCurrentPosition,
  getGoogleMapLocation,
  getLocationErrorMessage,
  reverseGeocode,
} from "@/fe/components/facilities/facility-form.shared";

export function useFacilityLocation(form: FormInstance) {
  const [modal, modalContextHolder] = Modal.useModal();
  const [locating, setLocating] = useState(false);

  const address = Form.useWatch("address", form) as string | undefined;
  const city = Form.useWatch("city", form) as string | undefined;
  const ward = Form.useWatch("ward", form) as string | undefined;
  const latitude = Form.useWatch("latitude", form) as string | undefined;
  const longitude = Form.useWatch("longitude", form) as string | undefined;

  const fullAddress = useMemo(
    () => [address, ward, city].filter(Boolean).join(", "),
    [address, city, ward],
  );

  const mapLocation = useMemo(
    () => getGoogleMapLocation(latitude, longitude),
    [latitude, longitude],
  );

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      modal.error({
        title: "Không hỗ trợ định vị",
        content: "Trình duyệt hiện tại không hỗ trợ lấy vị trí.",
        centered: true,
      });
      return;
    }

    if (!window.isSecureContext) {
      modal.error({
        title: "Không thể lấy vị trí",
        content: "Tính năng định vị chỉ hoạt động trên HTTPS hoặc localhost.",
        centered: true,
      });
      return;
    }

    setLocating(true);

    try {
      const position = await getCurrentPosition();
      const nextLatitude = position.coords.latitude;
      const nextLongitude = position.coords.longitude;

      form.setFieldsValue({
        latitude: nextLatitude.toFixed(7),
        longitude: nextLongitude.toFixed(7),
      });

      try {
        const result = await reverseGeocode(nextLatitude, nextLongitude);
        const fields = extractGeocodeFields(result);

        form.setFieldsValue({
          address: fields.streetAddress || result.display_name || "",
          ward: fields.ward,
          city: fields.city,
          latitude: nextLatitude.toFixed(7),
          longitude: nextLongitude.toFixed(7),
        });

        modal.success({
          title: "Đã lấy vị trí hiện tại",
          content: "Địa chỉ đã được tự động điền. Vui lòng kiểm tra lại trước khi lưu.",
          centered: true,
        });
      } catch {
        modal.warning({
          title: "Đã lấy được vị trí",
          content: "Không thể tự động điền địa chỉ. Bạn có thể nhập địa chỉ thủ công.",
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: "Không thể lấy vị trí",
        content: getLocationErrorMessage(error),
        centered: true,
      });
    } finally {
      setLocating(false);
    }
  }

  return {
    modal,
    modalContextHolder,
    locating,
    fullAddress,
    mapLocation,
    useCurrentLocation,
  };
}
