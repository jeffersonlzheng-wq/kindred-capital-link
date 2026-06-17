
CREATE POLICY "doc storage read own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='documents' AND owner = auth.uid());
CREATE POLICY "doc storage insert own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='documents' AND owner = auth.uid());
CREATE POLICY "doc storage delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='documents' AND owner = auth.uid());
