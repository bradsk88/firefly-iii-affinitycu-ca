import {sha512} from "js-sha512";
import {OpeningBalance} from "../../background/firefly_export";
import {debugLog} from "../auto_run/debug";

export function getButtonDestination(): Element {
    // TODO: Find a DOM element on the page where the manual "export to firefly"
    //  button should go.
    return document.body;
}

export function isPageReadyForScraping(): boolean {
    return true;
}

export function getAccountElements(): Element[] {
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => v.getElementsByTagName("button")[0]);
}

export function shouldSkipScrape(accountElement: Element): boolean {
    return false;
}

export function getAccountNumber(
    accountElement: Element,
): string {
    const input = accountElement.getElementsByTagName("input")[0];
    let accountNumber = input.attributes.getNamedItem('value')!.value;
    return sha512(accountNumber);
}

export function getAccountName(
    accountElement: Element,
): string {
    let name = accountElement.attributes.getNamedItem('aria-label')!.value
        .split(' for ')[1];
    debugLog('name', name);
    return name;
}

export function getOpeningBalance(
    accountElement: Element,
): OpeningBalance | undefined {
    // TODO: If you can confidently determine the opening balance, do that here.
    //  When in doubt, return undefined.
    return undefined;
}