
DROP POLICY IF EXISTS "Public can view hardware images" ON storage.objects;

CREATE POLICY "Authenticated users can view hardware images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'hardware-images');
