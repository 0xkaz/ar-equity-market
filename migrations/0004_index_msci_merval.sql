-- MERVAL moved from S&P (Yahoo ^MERV, last close 2026-10-16) to MSCI on 2026-10-19; the index is now read from
-- TradingView as BCBA:MMSCI (src/universe.ts INDEX_SYMBOL). tickers.code is UNIQUE, so ensureUniverse's
-- INSERT OR IGNORE could not add the new symbol next to the old MERVAL row: re-point that row instead. Its fetch state
-- is cleared so the next refresh loads the full history (~600 bars). The old ^MERV prices stay under their symbol.
UPDATE tickers
SET symbol = 'BCBA:MMSCI', name = 'MSCI MERVAL', active = 1, last_fetched_at = NULL, last_price_date = NULL, fetch_error = NULL
WHERE code = 'MERVAL' AND symbol = '^MERV';
