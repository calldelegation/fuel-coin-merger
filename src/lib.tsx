export const environments = { LOCAL: "local", TESTNET: "testnet", MAINNET: "mainnet" };
export const environment =
  process.env.VITE_DAPP_ENVIRONMENT || environments.LOCAL;
export const isLocal = environment === environments.LOCAL;
export const isTestnet = environment === environments.TESTNET;
export const isMainnet = environment === environments.MAINNET;
export const localProviderUrl = `http://127.0.0.1:${process.env.VITE_FUEL_NODE_PORT || 4000}/v1/graphql`;
export const testnetProviderUrl = "https://testnet.fuel.network/v1/graphql";
export const mainnetProviderUrl = "https://mainnet.fuel.network/v1/graphql";
export const providerUrl = isLocal ? localProviderUrl : mainnetProviderUrl;
export const playgroundUrl = providerUrl.replace("v1/graphql", "v1/playground");

export const renderTransactionId = (transactionId: string) => {
  if (isLocal) {
    return transactionId;
  }

  return (
    <a
      href={`https://app.fuel.network/tx/${transactionId}/simple`}
      target="_blank"
      rel="noreferrer"
      className="underline"
    >
      {transactionId}
    </a>
  );
};
