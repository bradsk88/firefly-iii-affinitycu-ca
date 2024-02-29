import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {parseDate} from "../../common/dates";
import {priceFromString} from "../../common/prices";
import {extensionBankName} from "../../extensionid";

export function getButtonDestination(): Element {
    return document.querySelector('.pure-g.notification-info')!;
}

/**
 * @param accounts The first page of account in your Firefly III instance
 */
export async function getCurrentPageAccount(
    allAccounts: AccountRead[],
): Promise<AccountRead> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = `${extensionBankName} - ${accountNameParts.join(' - ')}`;
    return allAccounts.find(acct => acct.attributes.name === accountName)!;
}

export function isPageReadyForScraping(): boolean {
    return true;
}

export function getRowElements(): Element[] {
    const table = document.querySelectorAll('div[aria-label="Transactions"] > div.table-body');
    const txs: Element = table.values().next()?.value;
    if (!txs) {
        return [];
    }
    return Array.from(txs.querySelectorAll('div.table-row'));
}

export function getRowDate(el: Element): Date {
    return parseDate(el.children.item(0)!.textContent!.trim());
}

function isRowLoading(r: Element): boolean {
    return false;
}

export function getRowAmount(r: Element, pageAccount: AccountRead): number {
    if (isRowLoading(r)) {
        throw new Error("Page is not ready for scraping")
    }
    return priceFromString(r.children.item(2)!.textContent!.trim());
}

export function getRowDesc(r: Element): string {
    return r.children.item(1)!.textContent!.replace(/\n|\s\s+/g, ' ').trim();
}

export function findBackToAccountsPageButton(): HTMLElement {
    return document.querySelector('button.btn-icon-back')!;
}
