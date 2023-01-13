import {sha512} from "js-sha512";
import {OpeningBalance} from "../../background/firefly_export";

export function getAccountElements(): Element[] {
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => v.getElementsByTagName("button")[0]);
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
    return accountElement.attributes.getNamedItem('aria-label')!.value
        .split('Transaction History for ')[1];
}

export function getOpeningBalance(
    accountElement: Element,
): OpeningBalance | undefined {
    // TODO: If you can confidently determine the opening balance, do that here.
    //  When in doubt, return undefined.
    return undefined;
}