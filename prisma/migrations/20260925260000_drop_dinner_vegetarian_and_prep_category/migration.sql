UPDATE "admin"."Recipe"
SET
  "title" = CASE WHEN "title" = 'Pasta Pesto Rosso' THEN 'Pasta Pesto' ELSE "title" END,
  "familyTitle" = CASE WHEN "familyTitle" = 'Pasta Pesto Rosso' THEN 'Pasta Pesto' ELSE "familyTitle" END,
  "tags" = COALESCE((
    SELECT array_agg(tag ORDER BY ordinality)
    FROM unnest("tags") WITH ORDINALITY AS listed(tag, ordinality)
    WHERE tag NOT IN ('dinner', 'vegetarian')
      AND NOT ("slug" = 'mascarpone-pasta' AND tag = 'quick')
  ), ARRAY[]::TEXT[]),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE 'dinner' = ANY("tags")
   OR 'vegetarian' = ANY("tags")
   OR ("slug" = 'mascarpone-pasta' AND 'quick' = ANY("tags"))
   OR "title" = 'Pasta Pesto Rosso'
   OR "familyTitle" = 'Pasta Pesto Rosso';
