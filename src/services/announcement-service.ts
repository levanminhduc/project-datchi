import { fetchApi } from '@/services/api'
import type {
  Announcement,
  AnnouncementListResponse,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementWithMeta,
} from '@/types/announcement'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/announcements'

export const announcementService = {
  async getPending(): Promise<Announcement[]> {
    const res = await fetchApi<ApiResponse<Announcement[]>>(`${BASE}/pending`)
    return res.data || []
  },

  async dismiss(id: number): Promise<void> {
    await fetchApi<ApiResponse<null>>(`${BASE}/${id}/dismiss`, { method: 'POST' })
  },

  async list(page = 1, pageSize = 25): Promise<AnnouncementListResponse> {
    return fetchApi<AnnouncementListResponse>(`${BASE}?page=${page}&pageSize=${pageSize}`)
  },

  async create(data: CreateAnnouncementData): Promise<AnnouncementWithMeta> {
    const res = await fetchApi<ApiResponse<AnnouncementWithMeta>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data!
  },

  async update(id: number, data: UpdateAnnouncementData): Promise<AnnouncementWithMeta> {
    const res = await fetchApi<ApiResponse<AnnouncementWithMeta>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.data!
  },

  async toggle(id: number): Promise<AnnouncementWithMeta> {
    const res = await fetchApi<ApiResponse<AnnouncementWithMeta>>(`${BASE}/${id}/toggle`, {
      method: 'PATCH',
    })
    return res.data!
  },

  async remove(id: number): Promise<void> {
    await fetchApi<ApiResponse<null>>(`${BASE}/${id}`, { method: 'DELETE' })
  },
}
