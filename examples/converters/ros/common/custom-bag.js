import {XVIZROSBag} from '@xviz/ros';

export class CustomBag extends XVIZROSBag {
  constructor(bagPath, topicConfig) {
    super(bagPath, topicConfig);
  }

  // Augment the initialization to ensure
  // the bag contains the data is supported
  // or add necessary data for extraction
  // async initBag(context, bag)

  // Augment metadata for custom entries and UI
  // async initMetadata()
}
