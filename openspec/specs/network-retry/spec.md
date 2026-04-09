## ADDED Requirements

### Requirement: Retry on network-level failures
The `fetchApiRaw` function SHALL retry requests when `fetch()` throws a TypeError (network-level failure such as DNS failure, no connectivity, or connection refused).

#### Scenario: Network error triggers retry
- **WHEN** `fetch()` throws a TypeError
- **THEN** the system SHALL retry the request up to 2 times with delays of 1000ms and 3000ms respectively

#### Scenario: Retry succeeds on second attempt
- **WHEN** the first `fetch()` call throws a TypeError
- **AND** the retry `fetch()` call succeeds
- **THEN** the system SHALL return the successful response normally

#### Scenario: All retries exhausted while offline
- **WHEN** all retry attempts throw TypeError
- **AND** `navigator.onLine` is `false`
- **THEN** the system SHALL throw an `ApiError` with status 503 and message "Mat ket noi mang, vui long thu lai khi co mang" (Vietnamese: "Mất kết nối mạng, vui lòng thử lại khi có mạng")

#### Scenario: All retries exhausted while online
- **WHEN** all retry attempts throw TypeError
- **AND** `navigator.onLine` is `true`
- **THEN** the system SHALL throw an `ApiError` with status 503 and message "Loi ket noi, vui long thu lai" (Vietnamese: "Lỗi kết nối, vui lòng thử lại")

### Requirement: Idempotent methods only by default
Network retry SHALL only apply to idempotent HTTP methods (GET, PUT, DELETE) by default. POST requests SHALL NOT be retried unless explicitly opted in.

#### Scenario: GET request is retried on network error
- **WHEN** a GET request throws a network TypeError
- **THEN** the system SHALL retry the request

#### Scenario: POST request is NOT retried by default
- **WHEN** a POST request throws a network TypeError
- **AND** no retry opt-in is configured
- **THEN** the system SHALL NOT retry and SHALL throw the appropriate ApiError immediately

#### Scenario: POST request retried when opted in
- **WHEN** a POST request throws a network TypeError
- **AND** the caller passes `{ retryOnNetworkError: true }` in the config parameter
- **THEN** the system SHALL retry the request following the same retry logic as idempotent methods

### Requirement: Network retry does not interfere with existing 502/503 retry
The network-level retry (for TypeError) SHALL operate independently from the existing HTTP 502/503 retry logic. Both can apply to the same request in sequence.

#### Scenario: Network error during 502/503 retry
- **WHEN** the initial request returns HTTP 502
- **AND** the 802 retry attempt throws a TypeError
- **THEN** the network retry logic SHALL apply to the 502 retry attempt

#### Scenario: Timeout errors are not retried as network errors
- **WHEN** `fetch()` throws an AbortError (timeout)
- **THEN** the system SHALL NOT trigger network retry
- **AND** SHALL throw ApiError(408) as before
