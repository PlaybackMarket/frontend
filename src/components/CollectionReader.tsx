import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
  publicKey,
} from '@metaplex-foundation/umi';
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';

import { useState, useEffect } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { toast } from 'react-hot-toast';

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
          try {
            const response = await fetch(asset.metadata.uri);
            data.jsonMetadata = await response.json();
          } catch (err) {
            console.error('Error fetching metadata:', err);
            toast.error('Failed to fetch collection metadata');
          }
        }

        setCollectionData(data);
      } catch (err) {
        console.error('Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast.error(`Failed to fetch collection: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionAddress, network.endpoint]);

  if (loading) {
    return (
      <div className='p-4 bg-gray-800 rounded-lg animate-pulse'>
        <div className='h-6 bg-gray-700 rounded w-48 mb-4'></div>
        <div className='space-y-3'>
          <div className='h-4 bg-gray-700 rounded w-32'></div>
          <div className='h-4 bg-gray-700 rounded w-40'></div>
          <div className='h-4 bg-gray-700 rounded w-36'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 bg-gray-800 rounded-lg border border-red-500'>
        <h2 className='text-xl font-bold mb-4 text-red-500'>
          Error Loading Collection
        </h2>
        <p className='text-red-400'>{error}</p>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className='p-4 bg-gray-800 rounded-lg'>
        <h2 className='text-xl font-bold mb-4'>No Collection Data</h2>
        <p className='text-gray-400'>No data found for this collection</p>
      </div>
    );
  }

  return (
    <div className='p-4 bg-gray-800 rounded-lg'>
      <h2 className='text-xl font-bold mb-4'>Collection Details</h2>
      <div className='space-y-2'>
        <p>Name: {collectionData.name}</p>
        <p>Symbol: {collectionData.symbol}</p>
        <p>URI: {collectionData.uri}</p>
        {collectionData.jsonMetadata && (
          <div>
            <h3 className='text-lg font-semibold mt-4 mb-2'>Metadata</h3>
            <pre className='bg-gray-900 p-4 rounded overflow-auto'>
              {JSON.stringify(collectionData.jsonMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
