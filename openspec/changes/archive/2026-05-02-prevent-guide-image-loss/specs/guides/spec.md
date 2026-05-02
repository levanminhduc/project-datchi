## MODIFIED Requirements

### Requirement: Save is disabled while image upload is in-flight
The guide editor SHALL track the number of in-flight image uploads and disable the Save and Publish buttons until all uploads have completed or been cancelled.

#### Scenario: User clicks "Thêm ảnh" and immediately tries to save
- **WHEN** an image upload is in progress (`uploadingCount > 0`)
- **THEN** the Save button and Publish button are both disabled (`:disable="true"`) and optionally show a tooltip "Đang tải ảnh, vui lòng chờ"

#### Scenario: Upload completes normally
- **WHEN** the upload request resolves (success or error) and `uploadingCount` returns to 0
- **THEN** the Save and Publish buttons are re-enabled

#### Scenario: User navigates away during upload
- **WHEN** the editor component is unmounted while an upload is pending
- **THEN** the in-flight request is cancelled via `AbortController.abort()` and the `uploadingCount` is decremented so no memory leak occurs

### Requirement: Paste and drop of image files shows a warning toast
When a user pastes or drags an image file onto the editor, the system SHALL prevent silent discard and display a Vietnamese toast warning.

#### Scenario: User pastes an image file
- **WHEN** a `paste` event on the editor DOM element contains `image/*` files in `event.clipboardData.files`
- **THEN** `event.preventDefault()` is called (preventing Tiptap silent drop) and a snackbar shows "Vui lòng dùng nút Thêm ảnh để tải lên"

#### Scenario: User drops an image file onto the editor
- **WHEN** a `drop` event on the editor DOM element contains `image/*` files in `event.dataTransfer.files`
- **THEN** `event.preventDefault()` is called and a snackbar shows "Vui lòng dùng nút Thêm ảnh để tải lên"

#### Scenario: User pastes non-image content
- **WHEN** a `paste` event contains only text or non-image data
- **THEN** the event is not intercepted; Tiptap handles it normally
