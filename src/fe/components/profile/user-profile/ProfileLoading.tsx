import { Card, Col, Row, Skeleton } from "antd";

export function ProfileLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card className="border-0 shadow-sm">
            <Skeleton active avatar paragraph={{ rows: 6 }} />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card className="border-0 shadow-sm">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}