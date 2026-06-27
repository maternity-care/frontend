"use client";

import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FileHeart,
  HeartPulse,
  Hospital,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";

import { AppShell } from "@/fe/components/layout/AppShell";
import useSetting from "@/hooks/useSetting";
import { SiteFooter } from "@/fe/components/layout/SiteFooter";

const { Title, Paragraph, Text } = Typography;

const services = [
  {
    title: "Khám thai định kỳ",
    description: "Theo dõi sức khỏe mẹ và bé theo từng giai đoạn thai kỳ.",
    icon: Stethoscope,
  },
  {
    title: "Siêu âm thai",
    description: "Lưu trữ hình ảnh, kết quả siêu âm và lịch sử thăm khám.",
    icon: Baby,
  },
  {
    title: "Xét nghiệm thai kỳ",
    description: "Quản lý kết quả xét nghiệm và hồ sơ y tế tập trung.",
    icon: FileHeart,
  },
  {
    title: "Nhắc lịch chăm sóc",
    description: "Tự động nhắc lịch khám, tái khám và lịch uống thuốc.",
    icon: CalendarCheck,
  },
];

const packages = [
  {
    name: "Basic",
    tag: "Phổ biến",
    price: "1.990.000đ",
    description: "Phù hợp cho mẹ bầu cần theo dõi thai kỳ cơ bản.",
    benefits: ["Khám thai định kỳ", "Nhắc lịch khám", "Lưu hồ sơ thai sản"],
  },
  {
    name: "VIP 1",
    tag: "Đề xuất",
    price: "3.990.000đ",
    description: "Bổ sung thêm quyền lợi siêu âm và xét nghiệm.",
    benefits: ["Khám thai + siêu âm", "Theo dõi kết quả online", "Ưu tiên đặt lịch"],
    highlight: true,
  },
  {
    name: "VIP+",
    tag: "Cao cấp",
    price: "5.990.000đ",
    description: "Chăm sóc thai kỳ toàn diện với hỗ trợ ưu tiên.",
    benefits: ["Tư vấn ưu tiên", "Nhiều quyền lợi dịch vụ", "Theo dõi thai kỳ nâng cao"],
  },
];

const doctors = [
  {
    name: "BS. Nguyễn Minh Anh",
    specialty: "Sản phụ khoa",
    facility: "Cơ sở Cần Thơ",
  },
  {
    name: "BS. Trần Hoàng Nam",
    specialty: "Siêu âm thai",
    facility: "Cơ sở Ninh Kiều",
  },
  {
    name: "BS. Lê Thanh Hương",
    specialty: "Theo dõi thai kỳ",
    facility: "Cơ sở Bình Thủy",
  },
];

const steps = [
  {
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản để bắt đầu quản lý hành trình thai kỳ.",
  },
  {
    title: "Tạo hồ sơ thai sản",
    description: "Lưu thông tin thai kỳ, tiền sử và các chỉ số sức khỏe.",
  },
  {
    title: "Chọn gói hoặc dịch vụ",
    description: "So sánh gói chăm sóc và chọn dịch vụ phù hợp.",
  },
  {
    title: "Đặt lịch khám",
    description: "Chọn cơ sở, bác sĩ, dịch vụ và khung giờ trống.",
  },
  {
    title: "Xem kết quả online",
    description: "Theo dõi kết quả khám, siêu âm, xét nghiệm và đơn thuốc.",
  },
];

const faqItems = [
  {
    key: "1",
    label: "Tôi có thể đặt lịch khám khi chưa đăng nhập không?",
    children:
      "Bạn có thể xem thông tin dịch vụ, bác sĩ và gói thai sản. Khi đặt lịch, hệ thống sẽ yêu cầu đăng nhập hoặc đăng ký tài khoản để bảo vệ thông tin cá nhân.",
  },
  {
    key: "2",
    label: "Hệ thống có thay thế việc khám trực tiếp không?",
    children:
      "Không. MCS hỗ trợ quản lý hồ sơ, đặt lịch, nhắc lịch và xem kết quả. Việc thăm khám, chẩn đoán và kê đơn vẫn do bác sĩ thực hiện.",
  },
  {
    key: "3",
    label: "Kết quả siêu âm và xét nghiệm có được lưu trong hệ thống không?",
    children:
      "Có. Kết quả khám, file siêu âm, xét nghiệm và đơn thuốc được lưu trong hồ sơ thai sản và chỉ người có quyền mới được xem.",
  },
];

export default function HomePage() {
  const { getOrDefault } = useSetting();

  const badge = getOrDefault("home_badge", "Maternity Care System");
  const title = getOrDefault(
    "hero_title",
    "Chăm sóc thai kỳ dễ dàng hơn trong một nền tảng duy nhất",
  );
  const description = getOrDefault(
    "hero_description",
    "Theo dõi hồ sơ thai sản, đặt lịch khám, xem kết quả siêu âm/xét nghiệm và nhận nhắc lịch quan trọng cùng MCS.",
  );

  return (
    <AppShell>
      <div className="space-y-20 pb-16">
        {/* Header / Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-50 via-rose-50 to-white px-6 py-10 shadow-sm ring-1 ring-pink-100 md:px-10 lg:px-14">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />

          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={14}>
              <div className="relative z-10">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-700 shadow-sm ring-1 ring-pink-100">
                  <HeartPulse className="h-4 w-4" />
                  {badge}
                </div>

                <Title
                  level={1}
                  className="!mb-4 !text-4xl !font-bold !leading-tight !text-slate-950 md:!text-5xl"
                >
                  {title}
                </Title>

                <Paragraph className="!mb-0 max-w-2xl !text-base !leading-7 !text-slate-600">
                  {description}
                </Paragraph>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/register">
                    <Button
                      type="primary"
                      size="large"
                      className="!h-12 !rounded-full !bg-pink-500 !px-7 !font-semibold !shadow-md !shadow-pink-200"
                    >
                      Đăng ký ngay
                      <ArrowRight className="ml-2 inline h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href="/login">
                    <Button
                      size="large"
                      className="!h-12 !rounded-full !border-pink-200 !px-7 !font-semibold !text-pink-600 hover:!border-pink-400 hover:!text-pink-700"
                    >
                      Đăng nhập
                    </Button>
                  </Link>

                  <Link href="/management/login">
                    <Button
                      size="large"
                      className="!h-12 !rounded-full !border-slate-200 !px-7 !font-semibold !text-slate-600"
                    >
                      Management
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-pink-100">
                    <Text className="!text-2xl !font-bold !text-pink-600">100+</Text>
                    <p className="mt-1 text-sm text-slate-600">người dùng đồng thời</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-pink-100">
                    <Text className="!text-2xl !font-bold !text-pink-600">24h</Text>
                    <p className="mt-1 text-sm text-slate-600">nhắc lịch khám</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-pink-100">
                    <Text className="!text-2xl !font-bold !text-pink-600">1 nơi</Text>
                    <p className="mt-1 text-sm text-slate-600">lưu hồ sơ thai sản</p>
                  </div>
                </div>
              </div>
            </Col>

            {/* Quick appointment */}
            <Col xs={24} lg={10}>
              <Card
                className="relative z-10 !rounded-[28px] !border-pink-100 !shadow-xl !shadow-pink-100/70"
                styles={{ body: { padding: 28 } }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-0 !text-slate-950">
                      Đặt lịch khám nhanh
                    </Title>
                    <Text className="!text-slate-500">Chọn thông tin để kiểm tra lịch trống</Text>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Select
                    size="large"
                    placeholder="Chọn cơ sở khám"
                    options={[
                      { value: "can-tho", label: "Cơ sở Cần Thơ" },
                      { value: "ninh-kieu", label: "Cơ sở Ninh Kiều" },
                      { value: "binh-thuy", label: "Cơ sở Bình Thủy" },
                    ]}
                  />

                  <Select
                    size="large"
                    placeholder="Chọn dịch vụ"
                    options={[
                      { value: "prenatal", label: "Khám thai định kỳ" },
                      { value: "ultrasound", label: "Siêu âm thai" },
                      { value: "lab-test", label: "Xét nghiệm thai kỳ" },
                      { value: "consultation", label: "Tư vấn thai kỳ" },
                    ]}
                  />

                  <Select
                    size="large"
                    placeholder="Chọn bác sĩ"
                    options={[
                      { value: "doctor-1", label: "BS. Nguyễn Minh Anh" },
                      { value: "doctor-2", label: "BS. Trần Hoàng Nam" },
                      { value: "doctor-3", label: "BS. Lê Thanh Hương" },
                    ]}
                  />

                  <DatePicker size="large" className="w-full" placeholder="Chọn ngày khám" />

                  <Link href="/login">
                    <Button
                      type="primary"
                      size="large"
                      block
                      className="!h-12 !rounded-xl !bg-pink-500 !font-semibold"
                    >
                      Kiểm tra lịch trống
                    </Button>
                  </Link>

                  <Text className="!text-xs !leading-5 !text-slate-500">
                    Bạn cần đăng nhập hoặc đăng ký tài khoản để hoàn tất đặt lịch và bảo vệ hồ sơ cá nhân.
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Pain points */}
        <section>
          <div className="mx-auto max-w-3xl text-center">
            <Tag color="pink" className="!mb-3 !rounded-full !px-4 !py-1">
              Vì sao cần MCS?
            </Tag>
            <Title level={2} className="!mb-3 !text-slate-950">
              Giảm rối trong quá trình chăm sóc thai kỳ
            </Title>
            <Paragraph className="!text-base !leading-7 !text-slate-600">
              MCS giúp mẹ bầu hạn chế quên lịch khám, thất lạc giấy tờ và khó theo dõi kết quả qua nhiều kênh khác nhau.
            </Paragraph>
          </div>

          <Row gutter={[16, 16]} className="mt-8">
            {[
              {
                title: "Không quên mốc khám",
                description: "Nhắc lịch khám, tái khám và lịch uống thuốc theo hồ sơ thai sản.",
                icon: CalendarCheck,
              },
              {
                title: "Hồ sơ tập trung",
                description: "Lưu kết quả khám, siêu âm, xét nghiệm và đơn thuốc theo timeline.",
                icon: FileHeart,
              },
              {
                title: "Đặt lịch rõ ràng",
                description: "Chọn cơ sở, dịch vụ, bác sĩ và khung giờ phù hợp.",
                icon: Hospital,
              },
              {
                title: "Bảo mật dữ liệu",
                description: "Hồ sơ thai sản chỉ hiển thị với người dùng có quyền truy cập.",
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Col xs={24} sm={12} lg={6} key={item.title}>
                  <Card className="h-full !rounded-3xl !border-pink-100 hover:!shadow-md hover:!shadow-pink-100">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Title level={4} className="!mb-2 !text-slate-950">
                      {item.title}
                    </Title>
                    <Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-600">
                      {item.description}
                    </Paragraph>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </section>

        {/* Services */}
        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Tag color="pink" className="!mb-3 !rounded-full !px-4 !py-1">
                Dịch vụ
              </Tag>
              <Title level={2} className="!mb-2 !text-slate-950">
                Dịch vụ chăm sóc thai kỳ nổi bật
              </Title>
              <Paragraph className="!mb-0 max-w-2xl !text-slate-600">
                Các dịch vụ được cấu hình theo từng cơ sở, giúp mẹ bầu dễ chọn nơi khám phù hợp.
              </Paragraph>
            </div>

            <Link href="/login">
              <Button className="!rounded-full !border-pink-200 !text-pink-600">
                Xem tất cả dịch vụ
              </Button>
            </Link>
          </div>

          <Row gutter={[16, 16]}>
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Col xs={24} md={12} lg={6} key={service.title}>
                  <Card className="h-full !rounded-3xl !border-pink-100">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                      <Icon className="h-7 w-7" />
                    </div>
                    <Title level={4} className="!mb-2 !text-slate-950">
                      {service.title}
                    </Title>
                    <Paragraph className="!mb-5 !text-sm !leading-6 !text-slate-600">
                      {service.description}
                    </Paragraph>
                    <Link href="/login" className="font-semibold text-pink-600">
                      Đặt lịch dịch vụ này →
                    </Link>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </section>

        {/* Packages */}
        <section className="rounded-[32px] bg-pink-50/70 px-6 py-10 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <Tag color="pink" className="!mb-3 !rounded-full !px-4 !py-1">
              Gói thai sản
            </Tag>
            <Title level={2} className="!mb-3 !text-slate-950">
              Chọn gói chăm sóc phù hợp với mẹ bầu
            </Title>
            <Paragraph className="!text-base !leading-7 !text-slate-600">
              So sánh quyền lợi, số lần khám, siêu âm, xét nghiệm và dịch vụ hỗ trợ trước khi đăng ký.
            </Paragraph>
          </div>

          <Row gutter={[16, 16]} className="mt-8">
            {packages.map((item) => (
              <Col xs={24} md={8} key={item.name}>
                <Card
                  className={[
                    "h-full !rounded-3xl",
                    item.highlight
                      ? "!border-pink-400 !shadow-xl !shadow-pink-100"
                      : "!border-pink-100",
                  ].join(" ")}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Title level={3} className="!mb-0 !text-slate-950">
                      {item.name}
                    </Title>
                    <Tag color={item.highlight ? "magenta" : "pink"} className="!rounded-full">
                      {item.tag}
                    </Tag>
                  </div>

                  <Text className="!text-3xl !font-bold !text-pink-600">{item.price}</Text>
                  <Paragraph className="!mt-3 !text-sm !leading-6 !text-slate-600">
                    {item.description}
                  </Paragraph>

                  <Divider className="!my-5" />

                  <div className="grid gap-3">
                    {item.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-pink-500" />
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <Link href="/login">
                    <Button
                      type={item.highlight ? "primary" : "default"}
                      block
                      className={[
                        "!mt-6 !h-11 !rounded-xl !font-semibold",
                        item.highlight
                          ? "!bg-pink-500"
                          : "!border-pink-200 !text-pink-600",
                      ].join(" ")}
                    >
                      Đăng ký gói
                    </Button>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Doctors */}
        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Tag color="pink" className="!mb-3 !rounded-full !px-4 !py-1">
                Bác sĩ
              </Tag>
              <Title level={2} className="!mb-2 !text-slate-950">
                Đội ngũ bác sĩ đồng hành cùng mẹ bầu
              </Title>
              <Paragraph className="!mb-0 max-w-2xl !text-slate-600">
                Mẹ bầu có thể xem thông tin bác sĩ, chuyên khoa và lịch làm việc trước khi đặt khám.
              </Paragraph>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {doctors.map((doctor) => (
              <Col xs={24} md={8} key={doctor.name}>
                <Card className="h-full !rounded-3xl !border-pink-100">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                      <UserRound className="h-7 w-7" />
                    </div>

                    <div>
                      <Title level={4} className="!mb-1 !text-slate-950">
                        {doctor.name}
                      </Title>
                      <Text className="!font-medium !text-pink-600">{doctor.specialty}</Text>
                      <p className="mt-2 text-sm text-slate-500">{doctor.facility}</p>
                    </div>
                  </div>

                  <Link href="/login">
                    <Button className="!mt-6 !rounded-xl !border-pink-200 !text-pink-600" block>
                      Xem lịch khám
                    </Button>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* How it works */}
        <section>
          <div className="mx-auto max-w-3xl text-center">
            <Tag color="pink" className="!mb-3 !rounded-full !px-4 !py-1">
              Quy trình
            </Tag>
            <Title level={2} className="!mb-3 !text-slate-950">
              Mẹ bầu sử dụng MCS như thế nào?
            </Title>
            <Paragraph className="!text-base !leading-7 !text-slate-600">
              Quy trình đơn giản từ đăng ký, tạo hồ sơ, đặt lịch đến xem kết quả khám.
            </Paragraph>
          </div>

          <Row gutter={[16, 16]} className="mt-8">
            {steps.map((step, index) => (
              <Col xs={24} md={12} lg={index === 4 ? 24 : 6} key={step.title}>
                <Card className="h-full !rounded-3xl !border-pink-100">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-pink-500 font-bold text-white">
                    {index + 1}
                  </div>
                  <Title level={4} className="!mb-2 !text-slate-950">
                    {step.title}
                  </Title>
                  <Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-600">
                    {step.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Support / FAQ */}
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="!rounded-3xl !border-pink-100 !bg-gradient-to-br !from-white !to-pink-50">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <MessageCircle className="h-7 w-7" />
            </div>

            <Title level={2} className="!mb-3 !text-slate-950">
              Hỗ trợ và kiến thức thai kỳ
            </Title>

            <Paragraph className="!text-base !leading-7 !text-slate-600">
              MCS cung cấp FAQ, bài viết kiến thức thai sản và kênh chat để mẹ bầu dễ dàng nhận hỗ trợ khi cần.
            </Paragraph>

            <Paragraph className="!text-sm !leading-6 !text-slate-500">
              Lưu ý: Hệ thống không thay thế chẩn đoán y khoa. Các vấn đề sức khỏe cần được bác sĩ hoặc cơ sở y tế tư vấn trực tiếp.
            </Paragraph>

            <Link href="/login">
              <Button type="primary" className="!mt-3 !rounded-xl !bg-pink-500">
                Bắt đầu sử dụng
              </Button>
            </Link>
          </Card>

          <Card className="!rounded-3xl !border-pink-100">
            <Title level={3} className="!mb-5 !text-slate-950">
              Câu hỏi thường gặp
            </Title>

            <Collapse
              ghost
              items={faqItems}
              className="[&_.ant-collapse-header]:!px-0 [&_.ant-collapse-content-box]:!px-0"
            />
          </Card>
        </section>

        {/* Final CTA */}
        <section className="rounded-[32px] bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-10 text-center text-white md:px-10">
          <Title level={2} className="!mb-3 !text-white">
            Sẵn sàng quản lý thai kỳ dễ dàng hơn?
          </Title>
          <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-pink-50">
            Tạo hồ sơ thai sản, đặt lịch khám và theo dõi kết quả trong một hệ thống duy nhất.
          </Paragraph>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="large" className="!h-12 !rounded-full !border-white !bg-white !px-7 !font-semibold !text-pink-600">
                Đăng ký ngay
              </Button>
            </Link>

            <Link href="/login">
              <Button size="large" className="!h-12 !rounded-full !border-white/70 !bg-transparent !px-7 !font-semibold !text-white">
                Đặt lịch khám
              </Button>
            </Link>
          </div>
        </section>
      </div>
      <SiteFooter />
    </AppShell>
  );
}