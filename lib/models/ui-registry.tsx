"use client";

import type { ProductModel } from "@/lib/products/model-store";
import type { ComponentType } from "react";
import BaziIntroStep from "@/components/models/bazi-v1/IntroStep";
import ModelInputClient from "@/components/models/bazi-v1/ModelInputClient";
import GenericIntroStep from "@/components/models/generic/IntroStep";

export interface ModelIntroProps {
  model: ProductModel;
  onContinue: () => void;
}

export interface ModelInputProps {
  model: ProductModel;
}

type ModelUiBundle = {
  Intro: ComponentType<ModelIntroProps>;
  Input: ComponentType<ModelInputProps>;
};

const MODEL_UI: Record<string, ModelUiBundle> = {
  bazi_v1: {
    Intro: BaziIntroStep,
    Input: ModelInputClient,
  },
  bazi_full: {
    Intro: BaziIntroStep,
    Input: ModelInputClient,
  },
};

const FALLBACK: ModelUiBundle = {
  Intro: GenericIntroStep,
  Input: ModelInputClient,
};

export function resolveUiKey(model: ProductModel): string {
  return model.config.ui_key ?? model.id;
}

export function getModelUi(model: ProductModel): ModelUiBundle {
  const key = resolveUiKey(model);
  return MODEL_UI[key] ?? FALLBACK;
}
