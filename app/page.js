"use client"
import { useEffect, useState } from "react";

export default function Home() {
  const [coreData, setCoreData] = useState(null);
  const [liqStakingData, setLiqStakingData] = useState(null);
  const [displayCount, setDisplayCount] = useState(9);
  const [collateralData, setCollateralData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [chainFilter, setChainFilter] = useState("");
  const [availableChains, setAvailableChains] = useState([]);
  const [activeMenu, setActiveMenu] = useState("coreData"); // Track active menu option


  useEffect(() => {
    async function fetchData() {
      const coreRes = await fetch('https://api.frax.finance/combineddata/');
      const coreResult = await coreRes.json();
      setCollateralData(coreResult.protocol.collateral);
      setCoreData(coreResult.core);

      const poolsRes = await fetch('https://api.frax.finance/pools');
      const poolsResult = await poolsRes.json();
      setLiqStakingData(poolsResult);

      const chains = [...new Set(poolsResult.map(pool => pool.chain))];
      setAvailableChains(chains);
    }
    fetchData();
  }, []);

  function roundOff(number) {
    return Math.round(number * 100) / 100;
  }

  function roundBillions(number) {
    return Math.round(number / 1000000000 * 1000) / 1000;
  }

  function roundMillions(number) {
    return Math.round(number / 1000000 * 10) / 10;
  }

  function handleInfinityAPY(apy) {
    return apy === "Infinity" || isNaN(apy) || apy === null ? 0 : apy;
  }


  function roundOffAllNumbers(data) {
    const roundedData = {};
    for (const key in data) {
      const roundedValues = {};
      for (const prop in data[key]) {
        if (typeof data[key][prop] === 'number') {
          roundedValues[prop] = roundOff(data[key][prop]);
        } else {
          roundedValues[prop] = data[key][prop];
        }
      }
      roundedData[key] = roundedValues;
    }
    return roundedData;
  }

  const roundedCoreData = coreData ? roundOffAllNumbers(coreData) : null;
  roundedCoreData && console.log(roundedCoreData);

  const handleShowMore = () => {
    setDisplayCount((prevCount) => prevCount + 9);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (event) => {
    setSortOption(event.target.value);
  };

  const handleChainFilter = (event) => {
    setChainFilter(event.target.value);
    setDisplayCount(9)
  };

  const filteredAndSortedData = liqStakingData
    ? liqStakingData.map(pool => ({
      ...pool,
      apy: handleInfinityAPY(pool.apy)
    }))
      .filter(pool =>
        pool.identifier.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (chainFilter === "" || pool.chain === chainFilter)
      )
      .sort((a, b) => {
        switch (sortOption) {
          case "highestAPY":
            return b.apy - a.apy;
          case "lowestAPY":
            return a.apy - b.apy;
          case "highestLiquidity":
            return b.liquidity_locked - a.liquidity_locked;
          case "lowestLiquidity":
            return a.liquidity_locked - b.liquidity_locked;
          default:
            return 0;
        }
      })
    : [];

  const analyticsData = liqStakingData
    ? {
      totalLiquidityLocked: liqStakingData.reduce((sum, pool) => sum + pool.liquidity_locked, 0),
      highestAPY: Math.max(...liqStakingData.map(pool => handleInfinityAPY(pool.apy))),
      highestAPYPair: liqStakingData.reduce((max, pool) =>
        handleInfinityAPY(pool.apy) > handleInfinityAPY(max.apy) ? pool : max
      ).identifier,
      mostLiquidityLocked: Math.max(...liqStakingData.map(pool => pool.liquidity_locked)),
      mostLiquidityLockedPair: liqStakingData.reduce((max, pool) =>
        pool.liquidity_locked > max.liquidity_locked ? pool : max
      ).identifier,
      averageAPY: liqStakingData.reduce((sum, pool) => sum + handleInfinityAPY(pool.apy), 0) /
        liqStakingData.filter(pool => handleInfinityAPY(pool.apy) > 0).length,
      totalPools: liqStakingData.length
    }
    : null;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-6">
        <h1 className="text-center mt-8 text-4xl font-bold text-indigo-600">Fraxlytics</h1>
        <h2 className="text-2xl text-center mt-2 text-gray-600">Global State Dashboard for Frax</h2>

        {collateralData ? (
          <div className="my-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
                <span className="text-sm font-medium text-gray-500">Block Number</span>
                <span className="text-3xl font-bold text-indigo-600 mt-2">{collateralData.blockNum}</span>
              </div>
              <div className="flex flex-col items-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
                <span className="text-sm font-medium text-gray-500">Credit Ratio (CR)</span>
                <span className="text-3xl font-bold text-indigo-600 mt-2">{collateralData.ratio.toFixed(3)}</span>
              </div>
              <div className="flex flex-col items-center p-4 border-b md:border-b-0 lg:border-r border-gray-200">
                <span className="text-sm font-medium text-gray-500">Decentralization Ratio (DR)</span>
                <span className="text-3xl font-bold text-indigo-600 mt-2">{collateralData.decentralization_ratio.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <span className="text-sm font-medium text-gray-500">Total Dollar Value</span>
                <span className="text-3xl font-bold text-indigo-600 mt-2">${roundBillions(collateralData.total_dollar_value)}B</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mt-10 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4">Loading Collateral Data...</p>
          </div>
        )}

        <div className="flex justify-center my-8">
          <button
            className={`mx-2 py-2 px-4 rounded-lg ${activeMenu === "coreData" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setActiveMenu("coreData")}
          >
            Core Data
          </button>
          <button
            className={`mx-2 py-2 px-4 rounded-lg ${activeMenu === "liqData" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setActiveMenu("liqData")}
          >
            Liquidity Data
          </button>
          
        </div>
        {activeMenu === "coreData" && (
          <div>
            {roundedCoreData ? (
              <div className="mt-12">
                {/* <h2 className="text-3xl font-bold mb-6 text-gray-800">Core Data</h2> */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['frax', 'fxs', 'frxeth', ...Object.keys(roundedCoreData).filter(key => key !== "vefxs" && !['frax', 'fxs', 'frxeth',].includes(key))].map((key) => (
                    <div key={key} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="bg-indigo-600 px-4 py-2">
                        <h3 className="text-xl font-semibold text-white">{key}</h3>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-700"><span className="font-medium">Price:</span> ${roundedCoreData[key].price}</p>
                        <p className="text-gray-700 mt-2"><span className="font-medium">Supply:</span> {roundedCoreData[key].supply}</p>
                        <p className="text-gray-700 mt-2"><span className="font-medium">Market Cap:</span> ${roundMillions(roundedCoreData[key].market_cap)}M</p>
                        {/* Add more data points as needed */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center mt-10 text-gray-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4">Loading Core Data...</p>
              </div>
            )}
          </div>
        )}

        {/* Liquid Staking Data */}
        {activeMenu === "liqData" && (
          <div>
            {liqStakingData ? (
              <div className="mt-12">

                {/* Analytics Card */}
                {analyticsData && (
                  <div className="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
                    <h2 className="text-2xl font-bold mb-4 bg-indigo-600 text-white px-6 py-4">Liquid Staking Analytics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="font-semibold text-gray-600">Total Liquidity Locked</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-2">${roundBillions(analyticsData.totalLiquidityLocked)}B</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="font-semibold text-gray-600">Highest APY</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-2">{roundOff(analyticsData.highestAPY)}%</p>
                        <p className="text-sm text-gray-500 mt-1">{analyticsData.highestAPYPair}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="font-semibold text-gray-600">Most Liquidity Locked</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-2">${roundBillions(analyticsData.mostLiquidityLocked)}B</p>
                        <p className="text-sm text-gray-500 mt-1">{analyticsData.mostLiquidityLockedPair}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="font-semibold text-gray-600">Average APY</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-2">{roundOff(analyticsData.averageAPY)}%</p>
                      </div>

                    </div>
                  </div>
                )}

                {/* Search and Sort Controls */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-md">
                  <input
                    type="text"
                    placeholder="Search by identifier..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="p-3 border rounded-lg mb-4 md:mb-0 md:mr-4 w-full md:w-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />

                  <select
                    value={chainFilter}
                    onChange={handleChainFilter}
                    className="p-3 border border-gray-300 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Chains</option>
                    {availableChains.map(chain => (
                      <option key={chain} value={chain}>{chain}</option>
                    ))}
                  </select>

                  <select
                    value={sortOption}
                    onChange={handleSort}
                    className="p-3 border rounded-lg w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="default">Default Sort</option>
                    <option value="highestAPY">Highest APY</option>
                    <option value="lowestAPY">Lowest APY</option>
                    <option value="highestLiquidity">Highest Liquidity</option>
                    <option value="lowestLiquidity">Lowest Liquidity</option>
                  </select>


                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                  {filteredAndSortedData.slice(0, displayCount).map((pool, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
                      <div>
                        <div className="bg-indigo-600 px-4 py-2">
                          <h3 className="text-xl font-semibold text-white">{pool.identifier}</h3>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-700"><span className="font-medium">Chain:</span> {pool.chain}</p>
                          <p className="text-gray-700 mt-2"><span className="font-medium">Pool Tokens:</span> {pool.pool_tokens.join(', ')}</p>
                          <p className="text-gray-700 mt-2"><span className="font-medium">Liquidity Locked:</span> ${roundOff(pool.liquidity_locked)}</p>
                          <p className="text-gray-700 mt-2"><span className="font-medium">APY:</span> {roundOff(handleInfinityAPY(pool.apy))}%</p>
                        </div>
                      </div>
                      <a href={pool.pairLink} target="_blank" rel="noopener noreferrer" className="mt-4 px-6 py-2 bg-indigo-600 text-white text-center w-full rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                        Stake
                      </a>
                    </div>
                  ))}
                </div>
                {displayCount < liqStakingData.length && (
                  <div className="text-center mt-8">
                    <button onClick={handleShowMore} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                      Show More
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center mt-10 text-gray-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4">Loading Liquid Staking Data...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}