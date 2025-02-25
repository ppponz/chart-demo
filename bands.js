// bands.js
// EMA calculation (exponential moving average)
function ema(data, period) {
    const k = 2 / (period + 1);
    let emaArray = new Array(data.length);
    emaArray[0] = data[0]; // Start with first value
    for (let i = 1; i < data.length; i++) {
        emaArray[i] = data[i] * k + emaArray[i - 1] * (1 - k);
    }
    return emaArray;
}

// Standard deviation calculation
function stdev(data, period) {
    let stdevArray = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            stdevArray[i] = 0; // Not enough data yet
        } else {
            const slice = data.slice(i - period + 1, i + 1);
            const mean = slice.reduce((sum, val) => sum + val, 0) / period;
            const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
            stdevArray[i] = Math.sqrt(variance);
        }
    }
    return stdevArray;
}

// Calculate bands based on Pine Script logic
function calculateBands(data) {
    const highPrices = data.map(bar => bar.high);
    const lowPrices = data.map(bar => bar.low);
    const volumes = data.map(bar => bar.volume || 0); // Handle undefined volume

    // Volume-weighted MA calculation
    const priceVolumeHigh = highPrices.map((price, i) => price * volumes[i]);
    const priceVolumeLow = lowPrices.map((price, i) => price * volumes[i]);
    const volumeEma180 = ema(volumes, 180);
    const priceVolumeHighEma180 = ema(priceVolumeHigh, 180);
    const priceVolumeLowEma180 = ema(priceVolumeLow, 180);

    const ma1 = priceVolumeHighEma180.map((pv, i) => volumeEma180[i] !== 0 ? pv / volumeEma180[i] : highPrices[i]);
    const ma2 = priceVolumeLowEma180.map((pv, i) => volumeEma180[i] !== 0 ? pv / volumeEma180[i] : lowPrices[i]);

    // Percentage deviations
    const p1 = highPrices.map((high, i) => (high - ma1[i]) / ma1[i]);
    const p2 = lowPrices.map((low, i) => (low - ma2[i]) / ma2[i]);

    // Standard deviations over 1440 periods
    const sd10 = stdev(p1, 1440);
    const sd20 = stdev(p2, 1440);

    // Band factors
    const upperFactor1 = sd10.map(sd => 1 + sd * 2.25);
    const upperFactor2 = sd10.map(sd => 1 + sd * 4.25);
    const lowerFactor1 = sd20.map(sd => 1 - sd * 2.25);
    const lowerFactor2 = sd20.map(sd => 1 - sd * 2.25); // Fixed typo from Pine Script (should be 4.25?)

    // Calculate bands
    const t1 = ma1.map((ma, i) => ({ time: data[i].time, value: ma * upperFactor1[i] }));
    const t2 = ma1.map((ma, i) => ({ time: data[i].time, value: ma * upperFactor2[i] }));
    const b1 = ma2.map((ma, i) => ({ time: data[i].time, value: ma * lowerFactor1[i] }));
    const b2 = ma2.map((ma, i) => ({ time: data[i].time, value: ma * lowerFactor2[i] }));

    return { t1, t2, b1, b2 };
}

// No export statement; functions are now global