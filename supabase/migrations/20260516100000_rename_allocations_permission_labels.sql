-- Rename Vietnamese labels for allocation permissions to reflect actual usage
-- (NCC Giao = supplier delivery confirmation + warehouse receive flow)

UPDATE permissions
SET name = 'Xem NCC Giao',
    description = 'Quyền xem trang theo dõi NCC giao và nhập kho'
WHERE code = 'thread.allocations.view';

UPDATE permissions
SET name = 'Quản Lý NCC Giao',
    description = 'Quyền xác nhận NCC giao và nhập kho'
WHERE code = 'thread.allocations.manage';
