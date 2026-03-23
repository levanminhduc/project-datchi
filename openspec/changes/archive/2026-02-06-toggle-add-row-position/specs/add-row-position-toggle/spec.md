## ADDED Requirements

### Requirement: Toggle switch hiển thị bên trái nút Thêm định mức
Hệ thống SHALL hiển thị một toggle switch bên trái nút "Thêm định mức" với label "Thêm đầu bảng".

#### Scenario: Switch hiển thị đúng vị trí
- **WHEN** user mở trang chi tiết mã hàng (`/thread/styles/[id]`)
- **THEN** toggle switch hiển thị bên trái nút "Thêm định mức" với label "Thêm đầu bảng"

### Requirement: Toggle switch thay đổi vị trí thêm dòng
Hệ thống SHALL thêm dòng mới vào đầu bảng khi switch bật (ON), và cuối bảng khi switch tắt (OFF).

#### Scenario: Thêm dòng cuối khi switch OFF (mặc định)
- **WHEN** toggle switch ở trạng thái OFF
- **AND** user click "Thêm định mức"
- **THEN** dòng mới được thêm vào cuối bảng định mức

#### Scenario: Thêm dòng đầu khi switch ON
- **WHEN** toggle switch ở trạng thái ON
- **AND** user click "Thêm định mức"
- **THEN** dòng mới được thêm vào đầu bảng định mức

### Requirement: Lưu preference vào localStorage
Hệ thống SHALL lưu trạng thái switch vào localStorage với key `datchi_addRowPosition`.

#### Scenario: Lưu khi user thay đổi switch
- **WHEN** user toggle switch từ OFF sang ON
- **THEN** localStorage key `datchi_addRowPosition` được set thành `"top"`

#### Scenario: Lưu khi user tắt switch
- **WHEN** user toggle switch từ ON sang OFF
- **THEN** localStorage key `datchi_addRowPosition` được set thành `"bottom"`

### Requirement: Khôi phục preference từ localStorage
Hệ thống SHALL đọc localStorage khi mount component và set trạng thái switch tương ứng.

#### Scenario: Khôi phục preference "top"
- **WHEN** localStorage có `datchi_addRowPosition = "top"`
- **AND** user mở trang chi tiết mã hàng
- **THEN** toggle switch ở trạng thái ON

#### Scenario: Mặc định OFF khi không có localStorage
- **WHEN** localStorage không có key `datchi_addRowPosition`
- **AND** user mở trang chi tiết mã hàng
- **THEN** toggle switch ở trạng thái OFF (mặc định cuối bảng)
