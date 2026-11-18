INSERT INTO "language" ("code", "name", "direction")
VALUES
  ('en', 'English', 'LTR'),
  ('vi', 'Tiếng Việt', 'LTR'),
  ('zh', '中文', 'LTR'),
  ('th', 'ภาษาไทย', 'LTR'),
  ('ja', '日本語', 'LTR')
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "glossary_term" ADD COLUMN IF NOT EXISTS "ja" VARCHAR(255);

UPDATE "glossary_term" SET "ja" = CASE "en"
  WHEN 'Assam' THEN 'アサム'
  WHEN 'Belacan' THEN 'ブラチャン'
  WHEN 'Char Siew' THEN 'チャーシュー'
  WHEN 'Cincau' THEN '仙草ゼリー'
  WHEN 'Dace' THEN 'ケンヒー'
  WHEN 'Garoupa' THEN 'ハタ'
  WHEN 'Gong-Bo' THEN '宮保'
  WHEN 'Kai Lan' THEN 'カイラン'
  WHEN 'Kam Heong' THEN 'カムヒョン'
  WHEN 'Kangkong' THEN '空心菜'
  WHEN 'La-La' THEN 'アサリ'
  WHEN 'Lady Finger' THEN 'オクラ'
  WHEN 'Marmite' THEN 'マーマイト'
  WHEN 'Nam Yu' THEN '南乳'
  WHEN 'Pandan' THEN 'パンダン'
  WHEN 'Petai' THEN 'ペタイ'
  WHEN 'Rendang' THEN 'ルンダン'
  WHEN 'Salted Egg' THEN '塩卵'
  WHEN 'Sambal' THEN 'サンバル'
  WHEN 'Seng Gua' THEN 'ヘチマ'
  WHEN 'Shao Hsing' THEN '紹興酒'
  WHEN 'Threadfin' THEN 'ツバメコノシロ'
  WHEN 'Village Chicken' THEN '地鶏'
  WHEN 'Yu Sheng' THEN 'ユーシェン'
  ELSE "ja"
END
WHERE "en" IN (
  'Assam', 'Belacan', 'Char Siew', 'Cincau', 'Dace', 'Garoupa',
  'Gong-Bo', 'Kai Lan', 'Kam Heong', 'Kangkong', 'La-La', 'Lady Finger',
  'Marmite', 'Nam Yu', 'Pandan', 'Petai', 'Rendang', 'Salted Egg',
  'Sambal', 'Seng Gua', 'Shao Hsing', 'Threadfin', 'Village Chicken', 'Yu Sheng'
);
