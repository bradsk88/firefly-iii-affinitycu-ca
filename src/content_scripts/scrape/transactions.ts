import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {PageAccount} from "../../common/accounts";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {parseDate} from "../../common/dates";

/**
 * @param allAccounts The first page of accounts in your Firefly III instance
 */
export async function getCurrentPageAccount(
    allAccounts: AccountRead[],
): Promise<PageAccount> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = accountNameParts.join(' - ');
    const account = allAccounts.find(acct => acct.attributes.name === accountName);
    return {
        id: account!.id!,
        name: account!.attributes.name,
        accountNumber: account!.attributes.accountNumber || undefined,
    };
}

/**
 * @param pageAccountId The Firefly III account ID for the current page
 */
export function scrapeTransactionsFromPage(
    pageAccountId: string,
): TransactionStore[] {
    const table = document.querySelectorAll('div[aria-label="Transactions"] > div.table-body');
    const txs: Element = table.values().next()?.value;
    if (!txs) {
        return [];
    }
    const txRows = txs.querySelectorAll('div.table-row');
    const data = Array.from(txRows.values()).map((row, index) => {
        const date = row.children.item(0)!.textContent!.trim();
        const desc = row.children.item(1)!.textContent!.trim();
        const amount = row.children.item(2)!.textContent!.trim();

        const tType = amount.startsWith("-") ? TransactionTypeProperty.Withdrawal : TransactionTypeProperty.Deposit;

        const absAmt = amount.replace('$', '').replace('-', '').replace(',', '');

        // FIXME: Get source ID from account name
        const sourceId = tType === TransactionTypeProperty.Withdrawal ? pageAccountId : undefined;
        const destId = tType === TransactionTypeProperty.Deposit ? pageAccountId : undefined;

        const tx: TransactionStore = {
            errorIfDuplicateHash: true,
            transactions: [{
                type: tType,
                sourceId: sourceId,
                destinationId: destId,
                date: parseDate(date),
                amount: absAmt,
                description: desc,
                currencyCode: 'CAD',
            }],
        }
        return tx;
    });
    return data.map(ts => {
        ts.transactions = ts.transactions.filter(t => t.amount.trim() !== "")
        return ts;
    });
}

export function findBackToAccountsPageButton(): HTMLElement {
    // TODO: Put this in the base project
    // TODO: Once a single account's transactions have been scraped, we need to
    //  go back to the main accounts page to finish the auto run. Find an
    //  element on the page that we can click on to go back.
    return document.querySelector('button.btn-icon-back')!;
}