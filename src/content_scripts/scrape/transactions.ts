import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {parseDate} from "../../common/dates";
import {priceFromString} from "../../common/prices";

export function getButtonDestination(): Element {
    // TODO: Find a DOM element on the page where the manual "export to firefly"
    //  button should go.
    return document.body;
}

/**
 * @param accounts The first page of account in your Firefly III instance
 */
export async function getCurrentPageAccount(
    accounts: AccountRead[],
): Promise<AccountRead> {
    // TODO: Find either the account number or account name on the page.
    const accountNumber = "<implement this>";
    // Use that to find the Firefly III account ID from the provided list.
    return accounts.find(
        acct => acct.attributes.accountNumber === accountNumber,
    )!;
}

export function getRowElements(): Element[] {
    // TODO: Find a list of DOM elements where each one represents a single
    //  transaction on the page. Example below.
    return Array.from(document.querySelectorAll(
        'div.table-container table tbody tr'
    ).values());
}

export function getRowDate(el: Element): Date {
    // TODO: Get the date from the row element. Example below.
    const date = el.querySelector('td.date span:nth-child(1)');
    return parseDate(date!.textContent!);
}

function isRowLoading(r: Element): boolean {
    // TODO: If possible, inspect the row to determine if it's ready to be
    //  scraped. Return false if it's not possible to detect this.
    return false;
}

export function getRowAmount(r: Element): number {
    if (isRowLoading(r)) {
        throw new Error("Page is not ready for scraping")
    }
    // TODO: Get the amount from the row element. Example below.
    const amountDiv = r.querySelector("div.amount");
    return priceFromString(amountDiv!.textContent!);
}

export function getRowDesc(r: Element): string {
    // TODO: Get the description from the row element. Example below.
    return r.querySelector(
        'td.description span.description-text',
    )!.textContent!
}
