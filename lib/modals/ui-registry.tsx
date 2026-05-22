"use client";

import type { ModalTemplate } from "@/lib/products/modal-store";
import type { ComponentType } from "react";
import BaziIntroStep from "@/components/modals/bazi-v1/IntroStep";
import ModalInputClient from "@/components/modals/bazi-v1/ModalInputClient";
import GenericIntroStep from "@/components/modals/generic/IntroStep";

export interface ModalIntroProps {
  modal: ModalTemplate;
  onContinue: () => void;
}

export interface ModalInputProps {
  modal: ModalTemplate;
}

type ModalUiBundle = {
  Intro: ComponentType<ModalIntroProps>;
  Input: ComponentType<ModalInputProps>;
};

/** Register new UI bundles here when adding a product line */
const MODAL_UI: Record<string, ModalUiBundle> = {
  bazi_v1: {
    Intro: BaziIntroStep,
    Input: ModalInputClient,
  },
  bazi_full: {
    Intro: BaziIntroStep,
    Input: ModalInputClient,
  },
};

const FALLBACK: ModalUiBundle = {
  Intro: GenericIntroStep,
  Input: ModalInputClient,
};

export function resolveUiKey(modal: ModalTemplate): string {
  return modal.config.ui_key ?? modal.id;
}

export function getModalUi(modal: ModalTemplate): ModalUiBundle {
  const key = resolveUiKey(modal);
  return MODAL_UI[key] ?? FALLBACK;
}
