-- AI previews are saved as PNG, so allow PNG in the private photo bucket.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png'], file_size_limit = 8388608
where id = 'progress-photos';
