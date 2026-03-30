CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  content_html TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER REFERENCES employees(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_guides_status ON guides(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_guides_slug ON guides(slug) WHERE deleted_at IS NULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('guide-images', 'guide-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Guide images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guide-images');

CREATE POLICY "Authenticated users can upload guide images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guide-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete guide images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'guide-images' AND auth.role() = 'authenticated');
