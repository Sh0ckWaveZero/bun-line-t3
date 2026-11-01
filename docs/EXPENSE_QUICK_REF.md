# Expense commands quick reference

## Transactions

```text
/จ่าย 250 อาหาร                         record an expense
/จ่าย 250 อาหาร #ข้าวมันไก่             add a note
/จ่าย 250 อาหาร @lunch @office          add tags
/รับ 30000 เงินเดือน                     record income
/expense                                current-month summary
/expense list 10                        latest 10 transactions
/expense today                          today's summary
/expense week                           this week's summary
/expense month 04                       April of the current year
/expense month 2026-04                  April 2026
/expense อาหาร                         filter by category
/expense edit 300                       edit the latest transaction amount
/expense edit note ข้าวมันไก่            edit the latest transaction note
/expense del                            choose a transaction to remove
/expense del <id>                       remove a transaction by ID
```

## Categories

```text
/category list
/category add คาเฟ่ ☕
/category del คาเฟ่    # deactivates the category
```

## Budgets

```text
/budget status
/budget set อาหาร 5000
/budget set อาหาร 5000 90
/budget set total 20000
/budget list
/budget del อาหาร
/budget alert อาหาร 85
```

## Natural language

`/ai <request>` can route supported expense and budget requests through the registered commands. Use `/ai help` for usage examples. AI routing does not replace normal server-side validation.

For the web interface, data scope, and implementation overview, see [Expense Tracking](./EXPENSE_TRACKING.md).
