import { createElement, type ComponentType } from "react";
import { LineApprovalGuard } from "./LineApprovalGuard";

export function withLineApproval<P extends object>(
  Component: ComponentType<P>,
) {
  return function WithLineApproval(props: P) {
    return createElement(
      LineApprovalGuard,
      null,
      createElement(Component, props),
    );
  };
}
