import {
  useConnectUI,
  useIsConnected,
  useNetwork,
  useDisconnect,
  useWallet,
  useBalance,
} from "@fuels/react";
import { useEffect, useState } from "react";

import Button from "./components/Button";
import LocalFaucet from "./components/LocalFaucet";
import { providerUrl, isLocal } from "./lib.tsx";
import {
  bn,
  Coin,
  DEFAULT_DECIMAL_UNITS,
  DEFAULT_PRECISION,
  ScriptTransactionRequest,
} from "fuels";
import { useNotification } from "./hooks/useNotification.tsx";

function App() {
  const { connect } = useConnectUI();
  const { isConnected, refetch } = useIsConnected();
  const { network } = useNetwork();
  const { disconnect } = useDisconnect();
  const { wallet } = useWallet();
  const {
    transactionSubmitNotification,
    transactionSuccessNotification,
    errorNotification,
  } = useNotification();

  const [maxInputs, setMaxInputs] = useState<number>(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const numberOfCoins = coins.length;

  const isConnectedToCorrectNetwork = network?.url === providerUrl;
  const address = wallet?.address.toB256() || "";
  const addressFormatted = address.slice(0, 6) + "..." + address.slice(-4);
  const { balance, refetch: refetchBalance } = useBalance({ address });
  const balanceFormatted = balance
    ? bn(balance).format({
        precision: DEFAULT_PRECISION,
        units: DEFAULT_DECIMAL_UNITS,
      })
    : "";

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    refetchBalance();
  }, [refetchBalance]);

  useEffect(() => {
    if (!wallet) return;

    const fetchCoins = async () => {
      const { maxInputs } =
        wallet.provider.getChain().consensusParameters.txParameters;
      setMaxInputs(maxInputs.toNumber());
      const assetId = await wallet.provider.getBaseAssetId();

      const { coins } = await wallet.getCoins(assetId);
      setCoins(coins);
    };

    const interval = setInterval(fetchCoins, 2500);
    return () => clearInterval(interval);
  }, [wallet, coins]);

  const mergeCoins = async () => {
    if (!wallet || !balance) return;
    try {
      const assetId = await wallet.provider.getBaseAssetId();
      const { maxInputs } =
        wallet.provider.getChain().consensusParameters.txParameters;
      const { coins } = await wallet.getCoins(assetId, {
        first: maxInputs.sub(1).toNumber(),
      });
      const balanceToMerge = coins
        .reduce((acc, coin) => acc.add(coin.amount), bn(0))
        .sub(bn(10_000));
      console.log(balanceToMerge.toString());

      const txRequest = new ScriptTransactionRequest();
      txRequest.addCoinOutput(wallet.address, balanceToMerge, assetId);
      coins.forEach((coin) => txRequest.addCoinInput(coin));
      const txCost = await wallet.getTransactionCost(txRequest);
      txRequest.gasLimit = txCost.gasUsed;
      txRequest.maxFee = txCost.maxFee;
      await wallet.fund(txRequest, txCost);

      const tx = await wallet.sendTransaction(txRequest);
      transactionSubmitNotification(tx.id);
      await tx.waitForResult();
      transactionSuccessNotification(tx.id);
      refetchBalance();
    } catch (error) {
      console.error(error);
      errorNotification(
        "Error merging coins. You may have reached the maximum number of coins that can be merged.",
      );
    }
  };

  return (
    <main
      data-theme="dark"
      className="flex items-center justify-center lg:pt-6 text-zinc-50/90"
    >
      <div id="container" className="mx-8 mb-32 w-full max-w-3xl">
        <nav id="nav" className="flex items-center justify-center py-1 md:py-6">
          <a href="https://fuel.network/" target="_blank" rel="noreferrer">
            <img src="./logo_white.png" alt="Fuel Logo" className="w-[124px]" />
          </a>
        </nav>

        <div className="gradient-border rounded-2xl">
          <div className="grain rounded-2xl p-1.5 drop-shadow-xl">
            <div
              id="grid"
              className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-12"
            >
              <div id="text" className="col-span-3 px-4 py-4">
                <h1 className="pb-6 pt-0 text-3xl font-medium">
                  <span className="text-green-500">Fuel</span> Coin Merger
                </h1>
                <p className="pb-6 font-mono">
                  When building transactions you may encounter errors regarding
                  funding the transaction if the number of coins fetched for an
                  asset exceeds the maximum allowed, more information on that
                  can be found{" "}
                  <a
                    href="https://docs.fuel.network/docs/fuels-ts/errors/#max_coins_reached"
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-500/80 transition-colors hover:text-green-500"
                  >
                    here
                  </a>
                  .
                </p>
                <p className="pb-4 font-mono">
                  This app helps mitigate the above errors by merging coins for
                  a single asset, more information on that can be found{" "}
                  <a
                    href="https://docs.fuel.network/docs/fuels-ts/cookbook/combining-utxos/#combining-utxos"
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-500/80 transition-colors hover:text-green-500"
                  >
                    here
                  </a>
                  .
                </p>
                <a
                  href="https://github.com/danielbate/fuel-coin-merger"
                  target="_blank"
                  className="inline-block text-green-500/80 transition-colors hover:text-green-500 w-full font-mono"
                  rel="noreferrer"
                >
                  Source
                </a>
              </div>
              <div className="col-span-4">
                <div className="gradient-border h-full rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950/80">
                  {!isConnected && (
                    <section className="flex h-full flex-col justify-center space-y-6 px-4 py-8 lg:px-[25%]">
                      <Button onClick={() => connect()}>Connect Wallet</Button>
                    </section>
                  )}

                  {isConnected && !isConnectedToCorrectNetwork && (
                    <section className="flex h-full flex-col justify-center space-y-6 px-4 py-8">
                      <p className="text-center">
                        You are connected to the wrong network. Please switch to{" "}
                        <a
                          href={providerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-500/80 transition-colors hover:text-green-500"
                        >
                          {providerUrl}
                        </a>
                        &nbsp;in your wallet.
                      </p>
                    </section>
                  )}

                  {isConnected && isConnectedToCorrectNetwork && (
                    <section className="flex h-full flex-col justify-left space-y-6 px-4 py-4">
                      <div className="flex flex-col flex-1">
                        <div className="flex mb-4">
                          <p className="flex-1">
                            Address:{" "}
                            <span className="font-mono text-green-500 font-semibold">
                              {addressFormatted}
                            </span>
                            <br />
                            Balance:{" "}
                            <span className="font-mono text-green-500 font-semibold">
                              {balanceFormatted} ETH
                            </span>
                            <br />
                            Number of Coins:{" "}
                            <span className="font-mono text-green-500 font-semibold">
                              {numberOfCoins}
                            </span>
                          </p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-6 w-6 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="font-mono text-sm">
                                The maximum number of coins that can be merged
                                per transaction is{" "}
                                <span className="font-semibold text-green-500">
                                  {maxInputs}
                                </span>
                                . This limit is dictated by the chain so you may
                                need to merge coins multiple times.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button
                            color="primary"
                            className="w-full mb-4"
                            onClick={mergeCoins}
                            disabled={!numberOfCoins}
                          >
                            Merge Coins
                          </Button>
                        </div>
                        <hr className="border-zinc-700 mb-4" />
                        {isLocal && <LocalFaucet refetch={refetchBalance} />}
                      </div>
                      <Button
                        className="w-full"
                        color="primary"
                        onClick={() => disconnect()}
                      >
                        Disconnect Wallet
                      </Button>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
