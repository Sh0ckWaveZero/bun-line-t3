import { CmcList } from '../types/cmc.interface';
import { cmcRepository } from './cmc.repository';


export const cmcService = {
  async findOne(symbol: string) {
    return await cmcRepository.findBySymbol(symbol);
  },

  async addCoinsList(items: any[]): Promise<any> {
    return await cmcRepository.addMany(
      items?.map((item: CmcList) => {
        return {
          id: item?.id,
          name: item?.name,
          symbol: item?.symbol,
          slug: item?.slug,
          updated_at: new Date(),
          created_at: new Date(),
        };
      }),
    );
  },
};
