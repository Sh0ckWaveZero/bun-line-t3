import type { NextApiRequest, NextApiResponse } from 'next'

import crypto from 'node:crypto';
import { env } from "~/env.mjs";
import { lineService } from '~/services/line';
import { utils } from '~/utils';

type ResponseData = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const data: any = JSON.stringify(req.body);

    const secret = env.LINE_CHANNEL_SECRET;
    const signature = crypto
      .createHmac('SHA256', secret as string)
      .update(data as string)
      .digest('base64')
      .toString();

    // Compare your signature and header's signature
    if (signature !== req.headers['x-line-signature']) {
      return res.status(401).send('Unauthorized' as any);
    }

    // set webhook
    if (utils.isEmpty(req?.body?.events)) {
      return res.status(200).json({ message: 'ok' });
    }

    return lineService.handleEvent(req, res);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}