import { Request, Response } from "express";

export const getCurrencies = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const map = new Map<string, string>();

        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(
                `https://api.restcountries.com/countries/v5?response_fields=currencies&limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.RESTCOUNTRIES_KEY}`,
                    },
                }
            );

            if (!response.ok) {
                const error = await response.text();

                res.status(response.status).json({
                    success: false,
                    error,
                });
                return;
            }

            const result = await response.json();

            const countries = result?.data?.objects;

            if (!Array.isArray(countries)) {
                res.status(500).json({
                    success: false,
                    error: "Unexpected response format from REST Countries API",
                });
                return;
            }

            // Extract unique currencies
            countries.forEach((country: any) => {
                const currencies = country?.currencies ?? [];

                currencies.forEach((currency: any) => {
                    if (currency?.code && !map.has(currency.code)) {
                        map.set(currency.code, currency.name);
                    }
                });
            });

            // Pagination info
            const meta = result?.data?.meta;

            hasMore = Boolean(meta?.more);

            if (hasMore) {
                offset += limit;
            }
        }

        const currencies = Array.from(map.entries())
            .map(([code, name]) => ({
                code,
                name,
            }))
            .sort((a, b) => a.code.localeCompare(b.code));

        res.status(200).json({
            success: true,
            count: currencies.length,
            data: currencies,
        });

    } catch (error) {
        console.error("Currency fetch error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to fetch currencies",
        });
    }
};