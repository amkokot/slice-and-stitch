param(
  [string]$AssetRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\modular-v4')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$canvasWidth = 1024
$canvasHeight = 1536
$sourceRoot = Join-Path $AssetRoot 'source'
$renderRoot = Join-Path $AssetRoot 'render'
New-Item -ItemType Directory -Force -Path $renderRoot | Out-Null

function New-TransparentCanvas {
  $bitmap = [System.Drawing.Bitmap]::new(
    $canvasWidth,
    $canvasHeight,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function Remove-Low-AlphaGlow {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$Threshold = 16
  )

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $pixel = $Bitmap.GetPixel($x, $y)
      if ($pixel.A -lt $Threshold) {
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
      }
    }
  }
}

function Add-MappedRegion {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Source,
    [int[]]$SourceRect,
    [int[]]$DestinationRect
  )

  $src = [System.Drawing.Rectangle]::new($SourceRect[0], $SourceRect[1], $SourceRect[2], $SourceRect[3])
  $dst = [System.Drawing.Rectangle]::new($DestinationRect[0], $DestinationRect[1], $DestinationRect[2], $DestinationRect[3])
  $Graphics.DrawImage($Source, $dst, $src, [System.Drawing.GraphicsUnit]::Pixel)
}

function Export-Layer {
  param(
    [string]$SourceName,
    [string]$OutputName,
    [object[]]$Mappings
  )

  $sourcePath = Join-Path $sourceRoot $SourceName
  $outputPath = Join-Path $renderRoot $OutputName
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  Remove-Low-AlphaGlow -Bitmap $source
  $canvas = New-TransparentCanvas
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  foreach ($mapping in $Mappings) {
    Add-MappedRegion -Graphics $graphics -Source $source -SourceRect $mapping.Source -DestinationRect $mapping.Destination
  }

  $graphics.Dispose()
  $source.Dispose()
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  Write-Host "Built $OutputName"
}

function Get-LinearValue {
  param(
    [double]$Position,
    [object[]]$Points,
    [string]$ValueName
  )

  if ($Position -le $Points[0].Position) { return [double]$Points[0][$ValueName] }
  for ($index = 1; $index -lt $Points.Count; $index++) {
    $right = $Points[$index]
    if ($Position -le $right.Position) {
      $left = $Points[$index - 1]
      $span = [double]$right.Position - [double]$left.Position
      $mix = if ($span -eq 0) { 0 } else { ($Position - [double]$left.Position) / $span }
      return [double]$left[$ValueName] + ([double]$right[$ValueName] - [double]$left[$ValueName]) * $mix
    }
  }
  return [double]$Points[-1][$ValueName]
}

function Export-SilhouetteMappedLayer {
  param(
    [string]$SourceName,
    [string]$OutputName,
    [object[]]$VerticalAnchors,
    [object[]]$WidthProfile
  )

  $sourcePath = Join-Path $sourceRoot $SourceName
  $outputPath = Join-Path $renderRoot $OutputName
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  Remove-Low-AlphaGlow -Bitmap $source
  $canvas = New-TransparentCanvas
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $firstY = [int]$VerticalAnchors[0].Destination
  $lastY = [int]$VerticalAnchors[-1].Destination
  for ($destinationY = $firstY; $destinationY -le $lastY; $destinationY++) {
    $sourceY = [int][Math]::Round((Get-LinearValue -Position $destinationY -Points $VerticalAnchors -ValueName 'Source'))
    $sourceY = [Math]::Max(0, [Math]::Min($source.Height - 1, $sourceY))
    $sourceLeft = $source.Width
    $sourceRight = -1
    for ($sourceX = 0; $sourceX -lt $source.Width; $sourceX++) {
      if ($source.GetPixel($sourceX, $sourceY).A -ge 16) {
        if ($sourceX -lt $sourceLeft) { $sourceLeft = $sourceX }
        $sourceRight = $sourceX
      }
    }
    if ($sourceRight -lt $sourceLeft) { continue }

    $destinationLeft = [int][Math]::Round((Get-LinearValue -Position $destinationY -Points $WidthProfile -ValueName 'Left'))
    $destinationRight = [int][Math]::Round((Get-LinearValue -Position $destinationY -Points $WidthProfile -ValueName 'Right'))
    $src = [System.Drawing.Rectangle]::new($sourceLeft, $sourceY, $sourceRight - $sourceLeft + 1, 1)
    $dst = [System.Drawing.Rectangle]::new($destinationLeft, $destinationY, $destinationRight - $destinationLeft + 1, 1)
    $graphics.DrawImage($source, $dst, $src, [System.Drawing.GraphicsUnit]::Pixel)
  }

  $graphics.Dispose()
  $source.Dispose()
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  Write-Host "Built $OutputName"
}

function Merge-FeetUnderBase {
  param(
    [string]$BaseName,
    [string]$FeetName
  )

  $basePath = Join-Path $renderRoot $BaseName
  $feetPath = Join-Path $renderRoot $FeetName
  $temporaryPath = Join-Path $renderRoot "$BaseName.tmp.png"
  $base = [System.Drawing.Bitmap]::new($basePath)
  $feet = [System.Drawing.Bitmap]::new($feetPath)

  # Feather the last 36px of the generated calves over the replacement feet.
  # Both use the same exact skin bucket, so the overlap reads as one continuous
  # ankle instead of exposing a hard raster cut.
  for ($y = 1284; $y -lt 1320; $y++) {
    $factor = (1320 - $y) / 36
    for ($x = 260; $x -lt 764; $x++) {
      $pixel = $base.GetPixel($x, $y)
      if ($pixel.A -gt 0) {
        $alpha = [int][Math]::Round($pixel.A * $factor)
        $base.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
      }
    }
  }

  $canvas = New-TransparentCanvas
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($feet, 0, 0, $canvasWidth, $canvasHeight)
  $graphics.DrawImage($base, 0, 0, $canvasWidth, $canvasHeight)
  $graphics.Dispose()
  $feet.Dispose()
  $base.Dispose()
  $canvas.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
  Move-Item -LiteralPath $temporaryPath -Destination $basePath -Force
}

# The base is authored on the canonical canvas. Its temporary fitting shoes are
# removed below the ankle so open footwear never reveals another shoe beneath it.
Export-Layer `
  -SourceName 'preset-medium-base-source-v1.png' `
  -OutputName 'preset-medium-base-v1.png' `
  -Mappings @(@{ Source = @(0, 0, 1024, 1320); Destination = @(0, 0, 1024, 1320) })

Export-Layer `
  -SourceName 'base-bare-feet-source-v1.png' `
  -OutputName 'base-bare-feet-v1.png' `
  -Mappings @(
    @{ Source = @(146, 998, 310, 351); Destination = @(289, 1280, 171, 145) },
    @{ Source = @(570, 998, 307, 351); Destination = @(568, 1280, 169, 145) }
  )

Merge-FeetUnderBase -BaseName 'preset-medium-base-v1.png' -FeetName 'base-bare-feet-v1.png'

# Canonical neutral-pose anchors (all coordinates are on the shared 1024x1536
# canvas): neck 512/320, shoulder line 300..724/350, waist 350..674/790,
# crotch 512/870, cuffs 350..674/1340, shoe baseline 1432.
Export-Layer `
  -SourceName 'top-white-rollsleeve-source-v1.png' `
  -OutputName 'top-white-rollsleeve-v1.png' `
  -Mappings @(@{ Source = @(140, 324, 741, 781); Destination = @(250, 300, 524, 550) })

Export-Layer `
  -SourceName 'top-teal-chore-source-v1.png' `
  -OutputName 'top-teal-chore-v1.png' `
  -Mappings @(@{ Source = @(16, 272, 993, 778); Destination = @(242, 270, 540, 580) })

# Trousers use non-linear vertical anchors so the waistband, crotch, and cuffs
# meet the body without flattening the illustrated leg detail.
Export-SilhouetteMappedLayer `
  -SourceName 'bottom-olive-cuffed-source-v1.png' `
  -OutputName 'bottom-olive-cuffed-v1.png' `
  -VerticalAnchors @(
    @{ Position = 775; Destination = 775; Source = 128 },
    @{ Position = 870; Destination = 870; Source = 464 },
    @{ Position = 1350; Destination = 1350; Source = 1421 }
  ) `
  -WidthProfile @(
    @{ Position = 775; Left = 335; Right = 689 },
    @{ Position = 870; Left = 326; Right = 698 },
    @{ Position = 1080; Left = 316; Right = 708 },
    @{ Position = 1350; Left = 318; Right = 706 }
  )

# Skirts use separate waist and drape zones so the shaped waistband meets the
# hips while the painted hem keeps its original fold rhythm.
Export-Layer `
  -SourceName 'bottom-plum-pleated-source-v1.png' `
  -OutputName 'bottom-plum-pleated-v1.png' `
  -Mappings @(
    @{ Source = @(325, 192, 375, 150); Destination = @(350, 778, 324, 92) },
    @{ Source = @(28, 300, 969, 1033); Destination = @(270, 852, 484, 390) }
  )

Export-Layer `
  -SourceName 'shoes-white-sneakers-source-v1.png' `
  -OutputName 'shoes-white-sneakers-v1.png' `
  -Mappings @(@{ Source = @(100, 712, 825, 497); Destination = @(296, 1318, 432, 124) })

Export-Layer `
  -SourceName 'apron-pizzeria-red-source-v1.png' `
  -OutputName 'apron-pizzeria-red-v1.png' `
  -Mappings @(@{ Source = @(16, 52, 993, 1373); Destination = @(246, 292, 532, 736) })

