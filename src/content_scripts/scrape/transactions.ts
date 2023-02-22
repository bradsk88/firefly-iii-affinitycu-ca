import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {parseDate} from "../../common/dates";

export function getButtonDestination(): Element {
    // TODO: Find a DOM element on the page where the manual "export to firefly"
    //  button should go.
    return document.body;
}

/**
 * @param allAccounts The first page of accounts in your Firefly III instance
 */
export async function getCurrentPageAccount(
    allAccounts: AccountRead[],
): Promise<AccountRead> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = accountNameParts.join(' - ');
    return allAccounts.find(acct => acct.attributes.name === accountName)!;
}


export function isPageReadyForScraping(): boolean {
    return true;
}

/**
 * @param pageAccount The Firefly III account for the current page
 */
export function scrapeTransactionsFromPage(
    pageAccount: AccountRead,
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
        const sourceId = tType === TransactionTypeProperty.Withdrawal ? pageAccount.id : undefined;
        const destId = tType === TransactionTypeProperty.Deposit ? pageAccount.id : undefined;

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
    // TODO: Once a single account's transactions have been scraped, we need to
    //  go back to the main accounts page to finish the auto run. Find an
    //  element on the page that we can click on to go back. Example below.
    return document.querySelector('button.btn-icon-back')!;
}