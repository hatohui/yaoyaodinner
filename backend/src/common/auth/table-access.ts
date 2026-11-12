/** `<tableId>:<code>` - the table a device has joined and the code it holds for it. */
export const TABLE_ACCESS_HEADER = 'x-table-access';

/** Active event PIN held by a guest device. */
export const EVENT_PIN_HEADER = 'x-event-pin';


/** The roster person this device claimed; AI features check they sit at the table. */
export const PERSON_HEADER = 'x-person-id';

/** Set by our web client. Browsers on other sites can't send it without passing CORS. */
export const CLIENT_HEADER = 'x-yaoyao-client';
export const CLIENT_NAME = 'web';
