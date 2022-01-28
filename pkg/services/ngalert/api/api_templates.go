package api

import (
	"errors"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	api "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/ngalert/services"
	"github.com/grafana/grafana/pkg/web"
)

type TemplateServer struct {
	service services.TemplateService
}

func (s *TemplateServer) RouteGetTemplates(c *api.ReqContext) response.Response {
	if !c.HasUserRole(api.ROLE_VIEWER) {
		return ErrResp(http.StatusForbidden, errors.New("permission denied"), "")
	}
	templates, err := s.service.GetTemplates(c.OrgId)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	return response.JSON(http.StatusOK, templates)
}

func (s *TemplateServer) RouteCreateTemplate(c *api.ReqContext) response.Response {
	if !c.HasUserRole(api.ROLE_EDITOR) {
		return ErrResp(http.StatusForbidden, errors.New("permission denied"), "")
	}
	template := services.EmbeddedTemplate{}
	if err := web.Bind(c.Req, &template); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	template, err := s.service.CreateTemplate(c.OrgId, template)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	return response.JSON(http.StatusOK, template)
}

func (s *TemplateServer) RouteUpdateTemplate(c *api.ReqContext) response.Response {
	if !c.HasUserRole(api.ROLE_EDITOR) {
		return ErrResp(http.StatusForbidden, errors.New("permission denied"), "")
	}
	template := services.EmbeddedTemplate{}
	if err := web.Bind(c.Req, &template); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	template, err := s.service.UpdateTemplate(c.OrgId, template)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	return response.JSON(http.StatusOK, template)
}

func (s *TemplateServer) RouteDeleteTemplate(c *api.ReqContext) response.Response {
	if !c.HasUserRole(api.ROLE_EDITOR) {
		return ErrResp(http.StatusForbidden, errors.New("permission denied"), "")
	}
	template := services.EmbeddedTemplate{}
	if err := web.Bind(c.Req, &template); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	err := s.service.DeleteTemplate(c.OrgId, template.Name)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	return response.JSON(http.StatusOK, "")
}