# THIẾT KẾ HỆ THỐNG - TÁC NHÂN VÀ BIỂU ĐỒ USE CASE

## Mục tiêu

Xác định rõ ràng tất cả các tác nhân và toàn bộ chức năng chính của hệ thống đặt phòng khách sạn trực tuyến.

## Yêu cầu cụ thể

## 1. Danh sách các tác nhân (Actors) và mô tả

Liệt kê các tác nhân sẽ tương tác trực tiếp với hệ thống, mô tả chi tiết vai trò của từng tác nhân trong hệ thống.

| STT | Tên tác nhân | Mô tả chi tiết |
|---|---|---|
| 1 | Khách hàng (Customer) | Người dùng cuối truy cập hệ thống để tìm kiếm thông tin phòng, xem chi tiết phòng, thực hiện đặt phòng trực tuyến, thanh toán, quản lý đặt phòng cá nhân và gửi đánh giá/phản hồi dịch vụ. |
| 2 | Nhân viên / Lễ tân (Staff / Receptionist) | Người vận hành nghiệp vụ tại khách sạn, chịu trách nhiệm quản lý đặt phòng, thực hiện check-in/check-out, cập nhật tình trạng phòng, xử lý yêu cầu của khách hàng và hỗ trợ thanh toán. |
| 3 | Quản trị viên (Admin) | Người quản lý toàn bộ hệ thống, có quyền quản lý phòng và loại phòng, quản lý giá và khuyến mãi, quản lý tài khoản người dùng, quản lý dịch vụ khách sạn, quản lý đặt phòng và xem thống kê/báo cáo. |

---

## 2. Biểu đồ Use Case tổng quát của hệ thống

Biểu đồ Use Case tổng quát mô tả các chức năng chính của hệ thống đặt phòng khách sạn trực tuyến và mối quan hệ giữa các tác nhân với hệ thống.

### Các nhóm chức năng chính

#### Nhóm chức năng cho Khách hàng

- Quản lý tài khoản cá nhân.
- Tra cứu thông tin phòng.
- Đặt phòng trực tuyến.
- Quản lý đặt phòng cá nhân.
- Thanh toán.
- Đánh giá / phản hồi.

#### Nhóm chức năng cho Nhân viên / Lễ tân

- Quản lý đặt phòng.
- Quản lý check-in / check-out.
- Quản lý tình trạng phòng.
- Quản lý yêu cầu khách hàng.
- Hỗ trợ thanh toán.

#### Nhóm chức năng cho Quản trị viên

- Quản lý phòng và loại phòng.
- Quản lý giá và khuyến mãi.
- Quản lý tài khoản người dùng.
- Quản lý dịch vụ khách sạn.
- Thống kê / báo cáo.
- Quản lý đặt phòng.

#### Chức năng tự động của hệ thống

- Gửi thông báo tự động.


####Code mermaid


@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Khách hàng" as Customer
actor "Nhân viên / Lễ tân" as Staff
actor "Quản trị viên" as Admin

rectangle "Hệ thống đặt phòng khách sạn trực tuyến" {

  usecase "Quản lý tài khoản cá nhân" as UC1
  usecase "Tra cứu thông tin phòng" as UC2
  usecase "Đặt phòng trực tuyến" as UC3
  usecase "Quản lý đặt phòng cá nhân" as UC4
  usecase "Thanh toán" as UC5
  usecase "Đánh giá / phản hồi" as UC6

  usecase "Quản lý đặt phòng" as UC7
  usecase "Quản lý check-in / check-out" as UC8
  usecase "Quản lý tình trạng phòng" as UC9
  usecase "Quản lý yêu cầu khách hàng" as UC10

  usecase "Quản lý phòng & loại phòng" as UC11
  usecase "Quản lý giá & khuyến mãi" as UC12
  usecase "Quản lý tài khoản người dùng" as UC13
  usecase "Quản lý dịch vụ khách sạn" as UC14
  usecase "Thống kê / báo cáo" as UC15

  usecase "Gửi thông báo tự động" as UC16
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
Customer --> UC5
Customer --> UC6

Staff --> UC7
Staff --> UC8
Staff --> UC9
Staff --> UC10
Staff --> UC5

Admin --> UC11
Admin --> UC12
Admin --> UC13
Admin --> UC14
Admin --> UC15
Admin --> UC7

UC3 ..> UC2 : <<include>>
UC3 ..> UC5 : <<include>>

UC4 ..> UC16 : <<include>>
UC7 ..> UC16 : <<include>>
UC8 ..> UC9 : <<include>>

@enduml

---

