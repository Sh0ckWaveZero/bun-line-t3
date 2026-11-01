# Expense tracking

Expense tracking supports income and expense transactions on the `/expenses` web page and through LINE commands. Users can review summaries, categorize activity, set monthly budgets, hide displayed amounts, and export transactions from the web page.

## Web page

The current page includes month navigation, income/expense/balance cards, budget status, category and monthly charts, transaction filters, add/edit/delete dialogs, category management, and export. The page and API are authenticated and operate on the current user's records.

## LINE commands

```text
/จ่าย 250 อาหาร #ข้าวมันไก่ @lunch     add expense with note and tag
/รับ 30000 เงินเดือน                    add income
/expense                                 current-month summary
/expense list 10                         latest 10 records
/expense today                           current-day summary
/expense week                            current-week summary
/expense month 2026-04                   summary for a month
/expense อาหาร                          filter by category
/expense edit 300                        edit the latest record
/expense del                             choose a record to delete
/category list                           list categories
/category add คาเฟ่ ☕                    add category
/category del คาเฟ่                      deactivate category
/budget status                           view monthly budgets
/budget set อาหาร 5000 90               set amount and alert threshold
/budget set total 20000                  set overall budget
/budget list                             list budgets
/budget del อาหาร                        remove a budget
/budget alert อาหาร 85                   change its alert threshold
```

The LINE parser treats text after `#` as a note and `@name` as a tag. If no expense category is supplied, the handler can use the user's default/other category according to its existing logic. See the handler help response for exact syntax and edge cases.

Natural-language `/ai` routing supports registered expense, income, category, and budget commands; it is a convenience layer, and requests still go through the normal command handler. See [AI command routing](./AI_COMMAND_ROUTING.md).

## Data and implementation

Transaction, category, budget, recurring transaction, and savings goal models are in `prisma/schema.prisma`. Current browser/API routes expose transactions, categories, budgets, summaries, and overview data. Recurring transaction and savings goal server services exist, but this guide does not advertise them as user-facing workflows because no corresponding current page/API route is present in the route inventory.

The main modules are [`src/features/expenses/`](../src/features/expenses/) and [`src/features/line/commands/handleExpenseCommand.ts`](../src/features/line/commands/handleExpenseCommand.ts). Category and budget bot commands are handled by `handleCategoryCommand.ts` and `handleBudgetCommand.ts` in the same directory.

## Privacy

The web page has a control to hide transaction amounts in the current view. LINE summaries also honor the user's amount-visibility settings. This masks display values; it does not encrypt or delete transaction data.
