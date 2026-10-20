"use client";

import { useEffect, useRef, useState } from "react";

import {
  ImageIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCampusAction,
  updateCampusAction,
} from "@/features/universities/actions";
import { ENTITY_STATUSES } from "@/features/universities/constants";
import { cn } from "@/lib/utils";

const EMPTY_SELECT_VALUE = "__empty";
const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 };
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";
const MAP_DEFAULT_ZOOM = 13;
const MAP_MIN_ZOOM = 3;
const MAP_MAX_ZOOM = 18;

type CampusFormUniversity = {
  city: string;
  country: string;
  id: string;
};

type CampusFormValues = {
  address: string | null;
  city: string;
  country: string;
  id: string;
  imageAccessUrl?: string | null;
  imageUrl?: string | null;
  isMainCampus: boolean;
  latitude?: unknown;
  longitude?: unknown;
  name: string;
  notes: string | null;
  status: string;
};

type MapPoint = {
  lat: number;
  lng: number;
};

export function CampusForm({
  university,
  values,
}: {
  university: CampusFormUniversity;
  values?: CampusFormValues;
}) {
  const isEditing = Boolean(values);
  const initialPoint = getInitialPoint(values, university);
  const hasInitialCoordinates =
    toCoordinate(values?.latitude) !== null &&
    toCoordinate(values?.longitude) !== null;
  const [country, setCountry] = useState(values?.country ?? university.country);
  const [city, setCity] = useState(values?.city ?? university.city);
  const [address, setAddress] = useState(values?.address ?? "");
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(
    hasInitialCoordinates ? initialPoint : null,
  );
  const [mapCenter, setMapCenter] = useState(initialPoint);
  const [imageUrl, setImageUrl] = useState(values?.imageUrl ?? "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    values?.imageAccessUrl ??
      (values?.imageUrl?.startsWith("http") ? values.imageUrl : ""),
  );
  const [imageUploadError, setImageUploadError] = useState("");
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [mapStatus, setMapStatus] = useState("");

  async function handleUpload(file: File) {
    setImageUploadError("");
    setIsImageUploading(true);

    try {
      const payload = await uploadCampusImage(file, university.id);
      setImageUrl(payload.fileUrl);
      setImagePreviewUrl(payload.accessUrl ?? "");
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Kampus şəkli yüklənə bilmədi.",
      );
    } finally {
      setIsImageUploading(false);
    }
  }

  async function handlePointSelect(point: MapPoint) {
    setMapPoint(point);
    setMapCenter(point);
    setMapStatus("Ünvan yoxlanılır...");

    const result = await reverseGeocode(point);

    if (result) {
      setAddress(result.address);
      setCity(result.city || city);
      setCountry(result.country || country);
      setMapStatus("Ünvan seçildi");
      return;
    }

    setAddress(`${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
    setMapStatus("Koordinat seçildi");
  }

  async function handleAddressSearch() {
    const query = [address, city, country].filter(Boolean).join(", ");

    if (!query) {
      return;
    }

    setMapStatus("Xəritədə axtarılır...");
    const point = await geocodeAddress(query);

    if (!point) {
      setMapStatus("Ünvan tapılmadı");
      return;
    }

    setMapCenter(point);
    setMapPoint(point);
    setMapStatus("Xəritə yeniləndi");
  }

  return (
    <form
      action={isEditing ? updateCampusAction : createCampusAction}
      className="space-y-4"
    >
      <input name="universityId" type="hidden" value={university.id} />
      <input name="imageUrl" type="hidden" value={imageUrl} />
      <input
        name="latitude"
        type="hidden"
        value={mapPoint ? mapPoint.lat.toFixed(7) : ""}
      />
      <input
        name="longitude"
        type="hidden"
        value={mapPoint ? mapPoint.lng.toFixed(7) : ""}
      />
      {values ? (
        <input name="campusId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <EditModeBar href={`/universities/${university.id}?tab=campuses`} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <FormInput
            defaultValue={values?.name}
            name="name"
            placeholder="Əsas kampus"
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <FormInput
              name="country"
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Ölkə"
              required
              value={country}
            />
            <FormInput
              name="city"
              onChange={(event) => setCity(event.target.value)}
              placeholder="Şəhər"
              required
              value={city}
            />
          </div>
          <div className="flex gap-2">
            <FormInput
              name="address"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ünvan"
              value={address}
            />
            <Button
              className="h-11 shrink-0 rounded-2xl border-[#dce6f4] bg-white px-3 text-[#0b66ff]"
              onClick={handleAddressSearch}
              type="button"
              variant="outline"
            >
              <SearchIcon />
            </Button>
          </div>
        </div>

        <CampusImageField
          error={imageUploadError}
          imageUrl={imageUrl}
          isUploading={isImageUploading}
          onClear={() => {
            setImageUrl("");
            setImagePreviewUrl("");
            setImageUploadError("");
          }}
          onUpload={handleUpload}
          previewUrl={imagePreviewUrl}
        />
      </div>

      <MapPicker
        center={mapCenter}
        onCenterChange={setMapCenter}
        onPointSelect={handlePointSelect}
        point={mapPoint}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] px-3 py-2 text-xs font-semibold text-[#52627f]">
        <span>{mapStatus || "Xəritədən seçilmiş ünvan burada saxlanacaq."}</span>
        {mapPoint ? (
          <span>
            {mapPoint.lat.toFixed(5)}, {mapPoint.lng.toFixed(5)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <FormSelect
          defaultValue={values?.status}
          name="status"
          options={ENTITY_STATUSES}
        />
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-[#dce6f4] bg-white px-3 text-sm font-medium text-[#334568]">
          <input
            defaultChecked={values?.isMainCampus}
            name="isMainCampus"
            type="checkbox"
          />
          Əsas kampus
        </label>
      </div>

      <FormTextarea
        defaultValue={values?.notes ?? undefined}
        name="notes"
        placeholder="Kampus qeydləri"
      />
      <SubmitButton>
        {isEditing ? "Kampusu yenilə" : "Kampus əlavə et"}
      </SubmitButton>
    </form>
  );
}

function CampusImageField({
  error,
  imageUrl,
  isUploading,
  onClear,
  onUpload,
  previewUrl,
}: {
  error: string;
  imageUrl: string;
  isUploading: boolean;
  onClear: () => void;
  onUpload: (file: File) => Promise<void>;
  previewUrl: string;
}) {
  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await onUpload(file);
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-[#dce6f4] bg-white">
        <div className="flex aspect-[16/10] items-center justify-center bg-[#f3f7fc]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={previewUrl} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#637392]">
              <ImageIcon className="size-7 text-[#0b66ff]" />
              <span className="text-xs font-bold">Kampus şəkli</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <div className="min-w-0 flex-1 text-xs font-semibold text-[#637392]">
            {imageUrl ? "Şəkil yüklənib" : "PNG, JPG və ya WebP"}
          </div>
          {imageUrl ? (
            <button
              aria-label="Şəkli sil"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dce6f4] bg-white text-[#637392] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={onClear}
              type="button"
            >
              <XIcon />
            </button>
          ) : null}
          <label className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0b66ff] text-white shadow-[0_10px_24px_rgba(11,102,255,0.24)] transition hover:bg-[#075be8]">
            <UploadCloudIcon />
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={isUploading}
              onChange={handleChange}
              type="file"
            />
          </label>
        </div>
      </div>
      {isUploading ? (
        <p className="text-xs font-semibold text-[#0b66ff]">Şəkil yüklənir...</p>
      ) : null}
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function MapPicker({
  center,
  onCenterChange,
  onPointSelect,
  point,
}: {
  center: MapPoint;
  onCenterChange: (point: MapPoint) => void;
  onPointSelect: (point: MapPoint) => void;
  point: MapPoint | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const initialCenterRef = useRef(center);
  const onPointSelectRef = useRef(onPointSelect);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    onPointSelectRef.current = onPointSelect;
  }, [onPointSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const initialCenter = initialCenterRef.current;
    const map = new maplibregl.Map({
      attributionControl: false,
      center: [initialCenter.lng, initialCenter.lat],
      container: containerRef.current,
      dragRotate: false,
      keyboard: true,
      maxZoom: MAP_MAX_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      pitchWithRotate: false,
      style: MAP_STYLE_URL,
      zoom: MAP_DEFAULT_ZOOM,
    });

    mapRef.current = map;
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.on("load", () => {
      setIsMapReady(true);
      window.setTimeout(() => map.resize(), 80);
    });
    map.on("error", () => {
      setMapError("Xəritə yüklənmədi. Ünvan axtarışı ilə davam edə bilərsiniz.");
    });
    map.on("click", (event) => {
      onPointSelectRef.current({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.easeTo({
      center: [center.lng, center.lat],
      duration: 500,
      zoom: Math.max(map.getZoom(), MAP_DEFAULT_ZOOM),
    });
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!point) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        element: createCampusMarkerElement(),
        offset: [0, -14],
      })
        .setLngLat([point.lng, point.lat])
        .addTo(map);
      return;
    }

    markerRef.current.setLngLat([point.lng, point.lat]);
  }, [point]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce6f4] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf2f8] px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-[#07183a]">
            <MapPinIcon className="size-4 text-[#0b66ff]" />
            Xəritə seçimi
          </div>
          <div className="mt-0.5 text-xs font-medium text-[#71809f]">
            MapLibre GL və OpenFreeMap vector xəritəsi
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            className="size-8 rounded-xl border-[#dce6f4] bg-white"
            onClick={() => mapRef.current?.zoomOut()}
            size="icon"
            type="button"
            variant="outline"
          >
            <MinusIcon />
          </Button>
          <Button
            className="size-8 rounded-xl border-[#dce6f4] bg-white"
            onClick={() => mapRef.current?.zoomIn()}
            size="icon"
            type="button"
            variant="outline"
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <div className="relative h-[280px] min-h-[240px] bg-[#e7eef7] sm:h-[320px]">
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        />
        {!isMapReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#eef4fb] text-sm font-semibold text-[#52627f]">
            Xəritə hazırlanır...
          </div>
        ) : null}
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#334568] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur">
          Kliklə seç
        </div>
        {mapError ? (
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm">
            {mapError}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-2">
        <div className="px-1 text-xs font-semibold text-[#71809f]">
          {point
            ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
            : "Kampus nöqtəsini xəritədə seçin."}
        </div>
        <Button
          className="h-9 rounded-xl border-[#dce6f4] bg-white text-[#334568]"
          onClick={() => {
            const nextCenter = point ?? center;
            onCenterChange(nextCenter);
            mapRef.current?.easeTo({
              center: [nextCenter.lng, nextCenter.lat],
              duration: 450,
              zoom: MAP_DEFAULT_ZOOM,
            });
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <MapPinIcon data-icon="inline-start" />
          Mərkəzlə
        </Button>
      </div>
    </div>
  );
}

function EditModeBar({ href }: { href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] px-3 py-2">
      <span className="text-sm font-semibold text-[#334568]">
        Redaktə rejimi
      </span>
      <Button
        asChild
        className="h-8 rounded-xl border-[#dce6f4] bg-white px-3 text-[#334568]"
        size="sm"
        variant="outline"
      >
        <a href={href}>
          <XIcon data-icon="inline-start" />
          Cancel
        </a>
      </Button>
    </div>
  );
}

function FormInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn("h-11 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function FormTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn("min-h-24 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function FormSelect({
  defaultValue,
  name,
  options,
  placeholder,
  required,
}: {
  defaultValue?: string;
  name: string;
  options:
    | readonly string[]
    | Array<{
        label: string;
        value: string;
      }>;
  placeholder?: string;
  required?: boolean;
}) {
  const normalizedDefaultValue =
    defaultValue ?? (placeholder ? EMPTY_SELECT_VALUE : undefined);

  return (
    <Select
      defaultValue={normalizedDefaultValue}
      name={name}
      required={required}
    >
      <SelectTrigger className="h-11 w-full rounded-2xl border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] shadow-[0_8px_18px_rgba(15,23,42,0.03)] focus:border-[#0b66ff] focus:ring-[#0b66ff]/15">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="max-h-72 rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        position="popper"
      >
        <SelectGroup>
          {placeholder ? (
            <SelectItem
              className="rounded-xl py-2 font-semibold text-[#71809f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
              value={EMPTY_SELECT_VALUE}
            >
              {placeholder}
            </SelectItem>
          ) : null}
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label =
              typeof option === "string" ? formatEnumLabel(option) : option.label;

            return (
              <SelectItem
                className="rounded-xl py-2 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
                key={value}
                value={value}
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      className="h-11 w-full rounded-2xl bg-[#0b66ff] shadow-[0_12px_28px_rgba(37,99,235,0.18)] hover:bg-[#075be8]"
      type="submit"
    >
      {children}
    </Button>
  );
}

function getInitialPoint(
  values: CampusFormValues | undefined,
  university: CampusFormUniversity,
) {
  const latitude = toCoordinate(values?.latitude);
  const longitude = toCoordinate(values?.longitude);

  if (latitude !== null && longitude !== null) {
    return { lat: latitude, lng: longitude };
  }

  return inferCityCenter(
    values?.city ?? university.city,
    values?.country ?? university.country,
  );
}

function inferCityCenter(city: string, country: string): MapPoint {
  const key = `${city}, ${country}`.toLowerCase();
  const knownCenters: Record<string, MapPoint> = {
    "berlin, germany": { lat: 52.52, lng: 13.405 },
    "istanbul, turkiye": { lat: 41.0082, lng: 28.9784 },
    "london, united kingdom": { lat: 51.5072, lng: -0.1276 },
    "melbourne, australia": { lat: -37.8136, lng: 144.9631 },
    "toronto, canada": { lat: 43.6532, lng: -79.3832 },
  };

  return knownCenters[key] ?? DEFAULT_CENTER;
}

function toCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
}

function createCampusMarkerElement() {
  const marker = document.createElement("div");
  marker.className =
    "relative size-8 rounded-full border-2 border-white bg-[#0b66ff] shadow-[0_12px_28px_rgba(11,102,255,0.35)]";
  marker.innerHTML =
    '<span class="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></span>';

  return marker;
}

async function reverseGeocode(point: MapPoint) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`,
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const address = payload.address ?? {};

    return {
      address:
        payload.display_name ??
        `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`,
      city:
        address.city ??
        address.town ??
        address.municipality ??
        address.county ??
        "",
      country: address.country ?? "",
    };
  } catch {
    return null;
  }
}

async function geocodeAddress(query: string): Promise<MapPoint | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
        query,
      )}`,
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const match = payload[0];

    if (!match?.lat || !match.lon) {
      return null;
    }

    return {
      lat: Number(match.lat),
      lng: Number(match.lon),
    };
  } catch {
    return null;
  }
}

async function uploadCampusImage(file: File, universityId: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("universityId", universityId);

  const response = await fetch("/api/universities/campus-image", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as {
    accessUrl?: string | null;
    fileUrl?: string;
    message?: string;
  };

  if (!response.ok || !payload.fileUrl) {
    throw new Error(payload.message ?? "Kampus şəkli yüklənə bilmədi.");
  }

  return {
    accessUrl: payload.accessUrl ?? null,
    fileUrl: payload.fileUrl,
  };
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
