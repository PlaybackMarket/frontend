import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import { useState, useEffect } from "react";
import { useNetwork } from "@/contexts/NetworkContext";

interface CollectionData {
  name: string;
  symbol: string;
  uri: string;
  jsonMetadata?: any;
}

export function CollectionReader({
  collectionAddress,
}: {
  collectionAddress: string;
}) {
  const [collectionData, setCollectionData] = useState<CollectionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { network } = useNetwork();

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        const umi = createUmi(network.endpoint);
        umi.use(mplTokenMetadata());

        const keypair = generateSigner(umi);
        umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

        const mintAddress = publicKey(collectionAddress);
        const asset = await fetchDigitalAsset(umi, mintAddress);

        const data: CollectionData = {
          name: asset.metadata.name,
          symbol: asset.metadata.symbol,
          uri: asset.metadata.uri,
        };

        if (asset.metadata.uri) {
          const response = await fetch(asset.metadata.uri);
          data.jsonMetadata = await response.json();
        }

        setCollectionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionAddress]);

  if (loading) return <div>Loading collection data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!collectionData) return <div>No collection data found</div>;

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Collection Details</h2>
      <div className="space-y-2">
        <p>Name: {collectionData.name}</p>
        <p>Symbol: {collectionData.symbol}</p>
        <p>URI: {collectionData.uri}</p>
        {collectionData.jsonMetadata && (
          <div>
            <h3 className="text-lg font-semibold mt-4 mb-2">Metadata</h3>
            <pre className="bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(collectionData.jsonMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
