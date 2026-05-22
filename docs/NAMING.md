# Naming: Model vs Modal vs AI model

## Product **Model** (this app)

A **model** is a sellable report product (八字完整報告、戀愛八字…).

| Layer | Name |
|-------|------|
| Database | `models`, `model_id`, `model_tags`, `tags` |
| TypeScript | `ProductModel`, `ModelId`, `model-store`, `MODEL_REGISTRY` |
| Routes | `/m/{slug}/intro`, `/m/{slug}/input` (`m` = model) |
| Components | `ModelCard`, `ModelJourneyProvider`, `components/models/` |

Do **not** use “modal” for products anymore.

## UI dialog **modal**

`SubjectFormModal`, `subjectModal` state on `/bazi/report` = popup overlay only. Unrelated to product models.

## AI **model**

`GEMINI_MODEL`, `aiOutputs[].model` = LLM provider (Gemini, GPT). Unrelated to product catalog.
