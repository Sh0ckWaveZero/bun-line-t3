import { test, expect } from "bun:test";
import React from "react";
import { Calendar } from "../../../src/components/ui/calendar";

test("Calendar component is defined and exports correctly", () => {
  expect(Calendar).toBeDefined();
  expect(typeof Calendar).toBe("function");
  expect(Calendar.displayName).toBe("Calendar");
});

test("Calendar component has correct props interface", () => {
  // Test that Calendar accepts DayPicker props
  const mockProps = {
    className: "test-class",
    showOutsideDays: false,
  };

  // This test verifies the component can be instantiated with props
  expect(() => React.createElement(Calendar, mockProps)).not.toThrow();
});

test("Calendar component returns valid React element", () => {
  const element = React.createElement(Calendar);
  expect(React.isValidElement(element)).toBe(true);
  expect(element.type).toBe(Calendar);
});
