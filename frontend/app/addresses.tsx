import { useLocalSearchParams } from 'expo-router';
import AddressScreenNew from './screens/address/AddressScreenNew';

export default function AddressesRoute() {
  const { select } = useLocalSearchParams();
  const showSelectOnly = select === 'true';

  return <AddressScreenNew showSelectOnly={showSelectOnly} />;
}

