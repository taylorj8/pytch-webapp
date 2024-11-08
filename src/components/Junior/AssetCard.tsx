import React from "react";
import classNames from "classnames";
import { AssetPresentation } from "../../model/asset";
import {
  ActorKind,
} from "../../model/junior/structured-program";
import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreState } from "../../store";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { AssetThumbnail } from "../AssetThumbnail";
import { useAssetCardDrag, useAssetCardDrop } from "./hooks";

import ImageAssetPreview from "../../images/drag-preview-image.png";
import SoundAssetPreview from "../../images/sound-wave-w96.png";
import { DragPreviewImage } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectId } from "../../model/project-core";
import { useRunFlow } from "../../model";
import { AssetMimeType } from "../../model/junior/structured-program/asset";

type RenameDropdownItemProps = {
  actorKind: ActorKind;
  assetKind: AssetMimeType;
  fullPathname: string;
};
const RenameDropdownItem: React.FC<RenameDropdownItemProps> = ({
  actorKind,
  assetKind,
  fullPathname,
}) => {
  const runRenameAsset = useRunFlow((f) => f.renameAssetFlow);

  const operationContextKey = `${actorKind}/${assetKind}` as const;
  const nameAffixes = PytchProgramOps.assetPathAffixes(fullPathname);
  const launchRename = () =>
    runRenameAsset({
      operationContextKey,
      fixedPrefix: nameAffixes.prefix,
      oldNameSuffix: nameAffixes.suffix,
    });

  return <Dropdown.Item onClick={launchRename}>Rename</Dropdown.Item>;
};

type DeleteDropdownItemProps = {
  assetKind: AssetMimeType;
  fullPathname: string;
  displayName: string;
  isAllowed: boolean;
};
const DeleteDropdownItem: React.FC<DeleteDropdownItemProps> = ({
  assetKind,
  fullPathname,
  displayName,
  isAllowed,
}) => {
  const runDeleteAsset = useRunFlow((f) => f.deleteAssetFlow);

  const onDelete = async () => {
    if (!isAllowed) {
      console.warn(`forbidding attempt to delete "${fullPathname}"`);
      return;
    }

    // Slight hack: We're relying on the internal assetKind name to be
    // suitable for display use.
    runDeleteAsset({
      kindDisplayName: assetKind,
      name: fullPathname,
      displayName,
    });
  };

  return (
    <Dropdown.Item className="danger" onClick={onDelete} disabled={!isAllowed}>
      DELETE
    </Dropdown.Item>
  );
};

type CropScaleDropdownItemProps = {
  projectId: ProjectId;
  presentation: AssetPresentation;
};
const CropScaleDropdownItem: React.FC<CropScaleDropdownItemProps> = ({
  projectId,
  presentation,
}) => {
  const runCropScaleImage = useRunFlow((f) => f.cropScaleImageFlow);

  if (presentation.presentation.kind !== "image") {
    return;
  }

  const transform = presentation.assetInProject.transform;
  if (transform.targetType !== "image")
    throw new Error(
      `asset is "image" but transformation is "${transform.targetType}"`
    );

  const fullSource = presentation.presentation.fullSourceImage;

  const onClick = () => {
    runCropScaleImage({
      projectId,
      assetName: presentation.name,
      existingCrop: transform,
      originalSize: { width: fullSource.width, height: fullSource.height },
      sourceURL: new URL(fullSource.src),
    });
  };

  return (
    <Dropdown.Item onClick={onClick}>
      <span className="with-icon">
        <span>Crop/scale</span>
        <FontAwesomeIcon icon="crop" />
      </span>
    </Dropdown.Item>
  );
};

type AssetCardDropdownProps = {
  actorKind: ActorKind;
  presentation: AssetPresentation;
  deleteIsAllowed: boolean;
};
const AssetCardDropdown: React.FC<AssetCardDropdownProps> = ({
  actorKind,
  presentation,
  deleteIsAllowed,
}) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const fullPathname = presentation.assetInProject.name;
  const basename = PytchProgramOps.assetPathAffixes(fullPathname).suffix;
  const assetKind = presentation.presentation.kind;

  return (
    <DropdownButton align="end" title="⋮">
      <CropScaleDropdownItem
        projectId={projectId}
        presentation={presentation}
      />
      <RenameDropdownItem
        actorKind={actorKind}
        assetKind={assetKind}
        fullPathname={fullPathname}
      />
      <DeleteDropdownItem
        assetKind={assetKind}
        fullPathname={fullPathname}
        displayName={basename}
        isAllowed={deleteIsAllowed}
      />
    </DropdownButton>
  );
};

type AssetCardProps = {
  assetKind: AssetMimeType;
  actorKind: ActorKind;
  displayIndex: number;
  assetPresentation: AssetPresentation;
  canBeDeleted: boolean;
};
export const AssetCard: React.FC<AssetCardProps> = ({
  assetKind,
  actorKind,
  displayIndex,
  assetPresentation,
  canBeDeleted,
}) => {
  const fullPathname = assetPresentation.name;

  const [dragProps, dragRef, preview] = useAssetCardDrag(fullPathname);
  const [dropProps, dropRef] = useAssetCardDrop(fullPathname);

  const presentation = assetPresentation.presentation;
  if (presentation.kind !== assetKind) {
    throw new Error(
      `expecting asset "${fullPathname}" to` +
        ` have presentation of kind "${assetKind}"` +
        ` but it is of kind "${presentation.kind}"`
    );
  }

  const classes = classNames(
    "AssetCard",
    `kind-${actorKind}`,
    dragProps,
    dropProps
  );
  const basename = PytchProgramOps.assetPathAffixes(fullPathname).suffix;

  const dragPreview =
    assetKind === "image" ? ImageAssetPreview : SoundAssetPreview;

  // TODO: Make the ActorCards accept a drop of an image too, adding
  // that image as asset to that actor.

  // Under live-reload development, the preview image only works the
  // first time you drag a particular asset.  It works correctly in a
  // static preview or release build.

  const indexLabel = (
    <div className={classNames("asset-card-display-index", actorKind)}>
      <p>
        <code>{displayIndex}</code>
      </p>
    </div>
  );

  return (
    <>
      <DragPreviewImage connect={preview} src={dragPreview} />
      <div className={classes}>
        <div ref={dropRef}>
          <div ref={dragRef}>
            <div className="drag-masked-card">
              <div className="content">
                <div className="AssetCardContent">
                  <div className="thumbnail">
                    <AssetThumbnail presentationData={presentation} />
                  </div>
                  <div className="label">
                    <pre>{basename}</pre>
                  </div>
                </div>
                {indexLabel}
                <AssetCardDropdown
                  actorKind={actorKind}
                  presentation={assetPresentation}
                  deleteIsAllowed={canBeDeleted}
                />
              </div>
              <div className="drag-mask" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
